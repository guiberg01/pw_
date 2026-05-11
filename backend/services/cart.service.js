import Cart from "../models/cart.model.js";
import Coupon from "../models/coupon.model.js";
import CouponUsage from "../models/couponUsage.model.js";
import {
  calcCartTotals,
  ensureGuestCartId,
  findOrCreatePersistedCart,
  getMaxQuantityPerPerson,
  getProductOrThrow,
  hydrateCartItems,
  readGuestCart,
  removeCartItem,
  upsertCartItem,
  writeGuestCart,
} from "../helpers/cart.helper.js";
import { createHttpError } from "../helpers/httpError.js";
import { notifyCartReminderForUser } from "./notification.service.js";

const MAX_VERSION_RETRIES = 3;
const MAX_AUDIT_EVENTS = 50;

const isAuthenticated = (req) => Boolean(req.user?._id);
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const countCartItems = (items = []) => {
  return items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
};

const withVersionRetry = async (executor) => {
  let lastError;

  for (let attempt = 0; attempt < MAX_VERSION_RETRIES; attempt += 1) {
    try {
      return await executor();
    } catch (error) {
      lastError = error;

      if (error?.name !== "VersionError") {
        throw error;
      }
    }
  }

  throw lastError;
};

const appendAuditTrail = (currentAuditTrail = [], auditEvents = []) =>
  [...currentAuditTrail, ...auditEvents].slice(-MAX_AUDIT_EVENTS);

const cartItemsEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false;

  const mapA = new Map(a.map((item) => [item.productVariant.toString(), Number(item.quantity)]));

  for (const item of b) {
    if (mapA.get(item.productVariant.toString()) !== Number(item.quantity)) {
      return false;
    }
  }

  return true;
};

const couponsEqual = (a = {}, b = {}) => {
  const couponA = {
    couponId: a?.couponId?.toString?.() ?? a?.couponId ?? null,
    code: a?.code ?? null,
    discountType: a?.discountType ?? null,
    discountValue: a?.discountValue ?? null,
    maxDiscountAmount: a?.maxDiscountAmount ?? null,
  };
  const couponB = {
    couponId: b?.couponId?.toString?.() ?? b?.couponId ?? null,
    code: b?.code ?? null,
    discountType: b?.discountType ?? null,
    discountValue: b?.discountValue ?? null,
    maxDiscountAmount: b?.maxDiscountAmount ?? null,
  };

  return JSON.stringify(couponA) === JSON.stringify(couponB);
};

const getCartTarget = async (req, res) => {
  if (isAuthenticated(req)) {
    const cart = await Cart.findOne({ user: req.user._id });
    return { cart: cart ?? { items: [], auditTrail: [], appliedCoupon: null } };
  }

  const guestCartId = ensureGuestCartId(req, res);
  const guestCart = await readGuestCart(guestCartId);
  return { cart: guestCart ?? { items: [], auditTrail: [], appliedCoupon: null }, guestCartId };
};

const toAuditEvents = (removedItems = []) =>
  removedItems.map((item) => ({
    at: new Date(),
    productVariantId: String(item.productVariantId),
    reason: String(item.reason),
    quantity: Number(item.quantity ?? 0),
  }));

const normalizeAppliedCouponSnapshot = (coupon) => {
  if (!coupon) return null;

  return {
    couponId: coupon._id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue ?? 0),
    maxDiscountAmount: coupon.maxDiscountAmount == null ? null : Number(coupon.maxDiscountAmount),
  };
};

const resolveCartDiscount = ({ totalPrice, appliedCoupon }) => {
  if (!appliedCoupon?.code || !appliedCoupon?.discountType) {
    return {
      discount: null,
      finalTotal: totalPrice,
    };
  }

  let discountAmount =
    appliedCoupon.discountType === "percentage"
      ? roundMoney((Number(totalPrice) * Number(appliedCoupon.discountValue ?? 0)) / 100)
      : roundMoney(Number(appliedCoupon.discountValue ?? 0));

  if (appliedCoupon.maxDiscountAmount != null) {
    discountAmount = Math.min(discountAmount, Number(appliedCoupon.maxDiscountAmount));
  }

  discountAmount = Math.min(discountAmount, Number(totalPrice));
  const finalTotal = roundMoney(Number(totalPrice) - Number(discountAmount));

  return {
    discount: {
      code: appliedCoupon.code,
      description:
        appliedCoupon.discountType === "percentage"
          ? `${Number(appliedCoupon.discountValue ?? 0)}% de desconto`
          : `${roundMoney(Number(appliedCoupon.discountValue ?? 0)).toFixed(2)} de desconto`,
      amount: roundMoney(discountAmount),
    },
    finalTotal,
  };
};

const buildCouponCartContext = (hydratedItems = []) => {
  return hydratedItems.map((item) => ({
    productVariantId: item.productVariant._id.toString(),
    productId: item.productVariant.product._id.toString(),
    storeId: item.productVariant.product.store._id.toString(),
    categoryIds: Array.isArray(item.productVariant.product.category)
      ? item.productVariant.product.category.map((categoryId) => categoryId.toString())
      : [],
    unitPrice: Number(item.productVariant.price ?? 0),
    quantity: Number(item.quantity ?? 0),
  }));
};

const validateCouponForCartOrThrow = async ({ couponCode, hydratedItems, userId }) => {
  const coupon = await Coupon.findOne({ code: couponCode, status: { $in: ["active", "sold-out"] } });

  if (!coupon) {
    throw createHttpError("Cupom inválido ou indisponível", 400, undefined, "CART_COUPON_INVALID");
  }

  if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
    throw createHttpError("Cupom expirado", 400, undefined, "CART_COUPON_EXPIRED");
  }

  if (coupon.maxUses != null && Number(coupon.usedCount ?? 0) >= Number(coupon.maxUses)) {
    throw createHttpError("Cupom indisponível", 400, undefined, "CART_COUPON_SOLD_OUT");
  }

  const cartItems = buildCouponCartContext(hydratedItems);
  const subTotal = roundMoney(cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));

  if (subTotal < Number(coupon.minOrderValue ?? 0)) {
    throw createHttpError("Subtotal abaixo do mínimo para uso do cupom", 400, undefined, "CART_COUPON_MIN_ORDER");
  }

  if (userId && coupon.maxUsesPerUser != null) {
    const userUsageCount = await CouponUsage.countDocuments({
      coupon: coupon._id,
      user: userId,
      order: { $ne: null },
    });

    if (userUsageCount >= Number(coupon.maxUsesPerUser)) {
      throw createHttpError("Limite de uso do cupom atingido", 400, undefined, "CART_COUPON_MAX_USES_PER_USER");
    }
  }

  const productFilterSet = new Set((coupon.products ?? []).map((id) => id.toString()));
  const storeFilterSet = new Set((coupon.stores ?? []).map((id) => id.toString()));
  const categoryFilterSet = new Set((coupon.categories ?? []).map((id) => id.toString()));

  const eligibleItems = cartItems.filter((item) => {
    const inProductFilter = productFilterSet.size === 0 || productFilterSet.has(item.productId);
    const inStoreFilter = storeFilterSet.size === 0 || storeFilterSet.has(item.storeId);
    const inCategoryFilter =
      categoryFilterSet.size === 0 || item.categoryIds.some((categoryId) => categoryFilterSet.has(categoryId));

    return inProductFilter && inStoreFilter && inCategoryFilter;
  });

  if (eligibleItems.length === 0) {
    throw createHttpError("Cupom não aplicável aos itens do carrinho", 400, undefined, "CART_COUPON_NOT_APPLICABLE");
  }

  return normalizeAppliedCouponSnapshot(coupon);
};

const buildCartResponse = async (req, target, items) => {
  const { hydratedItems, removedItems, sanitizedItems } = await hydrateCartItems(items);
  const { itemCount, totalPrice } = calcCartTotals(hydratedItems);
  const auditTrail = target.auditTrail ?? target.cart?.auditTrail ?? [];
  const appliedCoupon = target.appliedCoupon ?? target.cart?.appliedCoupon ?? null;
  const { discount, finalTotal } = resolveCartDiscount({ totalPrice, appliedCoupon });

  return {
    guestCartId: isAuthenticated(req) ? null : target.guestCartId,
    items: hydratedItems,
    sanitizedItems,
    itemCount,
    totalPrice,
    finalTotal,
    discount,
    appliedCoupon,
    removedItems: removedItems.length > 0 ? removedItems : null,
    auditTrail,
    lastUpdated: new Date().toISOString(),
  };
};

export const getItemQuantityInCart = (items, productId) => {
  const match = items.find((item) => item.productVariant?.toString?.() === productId.toString());
  return Number(match?.quantity ?? 0);
};

export const addProductToCartForRequest = async (req, res, productId, quantity = 1) => {
  const productVariant = await getProductOrThrow(productId);
  const previousPersistedCart = isAuthenticated(req)
    ? await Cart.findOne({ user: req.user._id }).select("items").lean()
    : null;
  const previousItemCount = countCartItems(previousPersistedCart?.items ?? []);

  if (productVariant.stock <= 0) {
    throw createHttpError("Produto sem estoque disponível", 400, undefined, "CART_OUT_OF_STOCK");
  }

  const result = await mutateCartForRequest(req, res, (items) => {
    const currentQuantity = getItemQuantityInCart(items, productVariant._id);
    const maxAllowed = getMaxQuantityPerPerson(productVariant);
    const finalQuantity = currentQuantity + Number(quantity);

    if (finalQuantity > maxAllowed || finalQuantity > Number(productVariant.stock)) {
      const hardLimit = Math.min(maxAllowed, Number(productVariant.stock));
      throw createHttpError(
        `Quantidade máxima por pessoa: ${hardLimit}`,
        400,
        { hardLimit, productId: productVariant._id.toString() },
        "CART_MAX_PER_PERSON_EXCEEDED",
      );
    }

    return upsertCartItem(items, productVariant._id, quantity, { increment: true });
  });

  if (isAuthenticated(req) && previousItemCount === 0 && result.itemCount > 0) {
    try {
      await notifyCartReminderForUser(req.user._id, { itemCount: result.itemCount });
    } catch (error) {
      console.warn("Falha não-crítica ao enviar notificação de carrinho:", error.message ?? error);
    }
  }

  return result;
};

export const updateProductQuantityForRequest = async (req, res, productId, quantity) => {
  const productVariant = await getProductOrThrow(productId);

  if (productVariant.stock <= 0) {
    throw createHttpError("Produto sem estoque disponível", 400, undefined, "CART_OUT_OF_STOCK");
  }

  const maxAllowed = getMaxQuantityPerPerson(productVariant);
  const hardLimit = Math.min(maxAllowed, Number(productVariant.stock));
  if (quantity > hardLimit) {
    throw createHttpError(
      `Quantidade máxima por pessoa: ${hardLimit}`,
      400,
      { hardLimit, productId: productVariant._id.toString() },
      "CART_MAX_PER_PERSON_EXCEEDED",
    );
  }

  return mutateCartForRequest(req, res, (items) => upsertCartItem(items, productId, quantity));
};

export const decrementProductForRequest = async (req, res, productId) => {
  await getProductOrThrow(productId);
  return mutateCartForRequest(req, res, (items) => upsertCartItem(items, productId, -1, { increment: true }));
};

export const removeProductFromCartForRequest = async (req, res, productId) => {
  await getProductOrThrow(productId);
  return mutateCartForRequest(req, res, (items) => removeCartItem(items, productId));
};

export const clearCartForRequest = async (req, res) => {
  return mutateCartForRequest(req, res, () => [], { appliedCoupon: null });
};

export const applyCouponForRequest = async (req, res, couponCode) => {
  const current = await getCartTarget(req, res);
  const { hydratedItems } = await hydrateCartItems(current.cart.items ?? []);

  if (hydratedItems.length === 0) {
    throw createHttpError("Adicione itens ao carrinho para aplicar um cupom", 400, undefined, "CART_EMPTY");
  }

  const normalizedCode = String(couponCode ?? "")
    .trim()
    .toUpperCase();
  const appliedCoupon = await validateCouponForCartOrThrow({
    couponCode: normalizedCode,
    hydratedItems,
    userId: req.user?._id,
  });

  return mutateCartForRequest(req, res, (items) => items, { appliedCoupon });
};

export const removeCouponForRequest = async (req, res) => {
  return mutateCartForRequest(req, res, (items) => items, { appliedCoupon: null });
};

export const mutateCartForRequest = async (req, res, mutator, { appliedCoupon: nextAppliedCoupon } = {}) => {
  if (isAuthenticated(req)) {
    return withVersionRetry(async () => {
      const cart = await findOrCreatePersistedCart(req.user._id);
      const currentItems = cart.items ?? [];
      const nextItems = await mutator(currentItems);
      const appliedCoupon = nextAppliedCoupon === undefined ? (cart.appliedCoupon ?? null) : nextAppliedCoupon;
      const response = await buildCartResponse(req, { auditTrail: cart.auditTrail ?? [], appliedCoupon }, nextItems);
      const auditEvents = toAuditEvents(response.removedItems ?? []);

      cart.items = response.sanitizedItems;
      cart.appliedCoupon = response.appliedCoupon ?? null;
      cart.auditTrail = appendAuditTrail(cart.auditTrail ?? [], auditEvents);
      await cart.save();

      response.auditTrail = cart.auditTrail;
      delete response.sanitizedItems;
      return response;
    });
  }

  const target = await getCartTarget(req, res);
  const nextItems = await mutator(target.cart.items ?? []);
  const appliedCoupon = nextAppliedCoupon === undefined ? (target.cart.appliedCoupon ?? null) : nextAppliedCoupon;
  const response = await buildCartResponse(req, { ...target, appliedCoupon }, nextItems);
  const auditEvents = toAuditEvents(response.removedItems ?? []);
  const nextAuditTrail = appendAuditTrail(target.cart.auditTrail ?? [], auditEvents);

  await writeGuestCart(target.guestCartId, {
    items: response.sanitizedItems,
    appliedCoupon: response.appliedCoupon ?? null,
    auditTrail: nextAuditTrail,
  });

  response.auditTrail = nextAuditTrail;
  delete response.sanitizedItems;
  return response;
};

export const getCartForRequest = async (req, res) => {
  if (isAuthenticated(req)) {
    return withVersionRetry(async () => {
      const cart = await findOrCreatePersistedCart(req.user._id);
      const response = await buildCartResponse(
        req,
        { auditTrail: cart.auditTrail ?? [], appliedCoupon: cart.appliedCoupon ?? null },
        cart.items ?? [],
      );
      const auditEvents = toAuditEvents(response.removedItems ?? []);
      const shouldPersistItems = !cartItemsEqual(cart.items ?? [], response.sanitizedItems);
      const shouldPersistAudit = auditEvents.length > 0;
      const shouldPersistCoupon = !couponsEqual(cart.appliedCoupon ?? null, response.appliedCoupon ?? null);

      if (shouldPersistItems || shouldPersistAudit || shouldPersistCoupon) {
        cart.items = response.sanitizedItems;
        cart.appliedCoupon = response.appliedCoupon ?? null;
        cart.auditTrail = appendAuditTrail(cart.auditTrail ?? [], auditEvents);
        await cart.save();
        response.auditTrail = cart.auditTrail;
      } else {
        response.auditTrail = cart.auditTrail ?? [];
      }

      delete response.sanitizedItems;
      return response;
    });
  }

  const target = await getCartTarget(req, res);
  const response = await buildCartResponse(req, target, target.cart.items ?? []);
  const auditEvents = toAuditEvents(response.removedItems ?? []);
  const nextAuditTrail = appendAuditTrail(target.cart.auditTrail ?? [], auditEvents);
  const shouldPersistCoupon = !couponsEqual(target.cart.appliedCoupon ?? null, response.appliedCoupon ?? null);

  if (
    !cartItemsEqual(target.cart.items ?? [], response.sanitizedItems) ||
    auditEvents.length > 0 ||
    shouldPersistCoupon
  ) {
    await writeGuestCart(target.guestCartId, {
      items: response.sanitizedItems,
      appliedCoupon: response.appliedCoupon ?? null,
      auditTrail: nextAuditTrail,
    });
  }

  response.auditTrail = nextAuditTrail;
  delete response.sanitizedItems;
  return response;
};
