import { sendSuccess } from "../helpers/successResponse.js";
import {
  createProductForStore,
  ensureStoreHasNoActiveProducts,
  findActiveProductOrThrow,
  findExistingStoreOrThrow,
  softDeleteProduct,
  softDeleteStore,
  updateProductAndPopulate,
} from "../services/catalog.service.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import { accountStatuses } from "../constants/accountStatuses.js";
import Store from "../models/store.model.js";

export const getAdminDashboardSummary = async (req, res, next) => {
  const [
    usersTotal,
    sellersTotal,
    customersTotal,
    adminsTotal,
    activeUsersTotal,
    suspendedUsersTotal,
    blockedUsersTotal,
    storesTotal,
    activeStoresTotal,
    pendingStoresTotal,
    suspendedStoresTotal,
    blockedStoresTotal,
    productsTotal,
    activeProductsTotal,
    blockedProductsTotal,
    highlightedProductsTotal,
    reviewsTotal,
    pendingOrdersTotal,
    paidOrdersTotal,
    recentStores,
    recentProducts,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "seller" }),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ status: accountStatuses.ACTIVE }),
    User.countDocuments({ status: accountStatuses.SUSPENDED }),
    User.countDocuments({ status: accountStatuses.BLOCKED }),
    Store.countDocuments({}),
    Store.countDocuments({ status: accountStatuses.ACTIVE }),
    Store.countDocuments({ status: accountStatuses.PENDING }),
    Store.countDocuments({ status: accountStatuses.SUSPENDED }),
    Store.countDocuments({ status: accountStatuses.BLOCKED }),
    Product.countDocuments({}),
    Product.countDocuments({ status: "active" }),
    Product.countDocuments({ status: "blocked" }),
    Product.countDocuments({ highlighted: true }),
    Review.countDocuments({}),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "paid" }),
    Store.find({}).sort({ createdAt: -1 }).limit(5).populate("owner", "name email role status").lean(),
    Product.find({}).sort({ createdAt: -1 }).limit(5).populate("store", "name slug status").lean(),
  ]);

  return sendSuccess(res, 200, "Resumo administrativo carregado com sucesso", {
    counts: {
      users: {
        total: usersTotal,
        sellers: sellersTotal,
        customers: customersTotal,
        admins: adminsTotal,
        active: activeUsersTotal,
        suspended: suspendedUsersTotal,
        blocked: blockedUsersTotal,
      },
      stores: {
        total: storesTotal,
        active: activeStoresTotal,
        pending: pendingStoresTotal,
        suspended: suspendedStoresTotal,
        blocked: blockedStoresTotal,
      },
      products: {
        total: productsTotal,
        active: activeProductsTotal,
        blocked: blockedProductsTotal,
        highlighted: highlightedProductsTotal,
      },
      reviews: {
        total: reviewsTotal,
      },
      orders: {
        pending: pendingOrdersTotal,
        paid: paidOrdersTotal,
      },
    },
    recentStores,
    recentProducts,
  });
};

export const allStoresForAdmin = async (req, res, next) => {
  const { page = 1, limit = 20 } = req.validatedQuery ?? {};
  const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(100, Math.max(1, Number(limit))) : 20;
  const skip = (safePage - 1) * safeLimit;

  const [stores, total, myStore] = await Promise.all([
    Store.find({}).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).populate("owner", "name email role"),
    Store.countDocuments({}),
    Store.findOne({ owner: req.user._id }).select("_id"),
  ]);

  return sendSuccess(res, 200, "Lojas listadas com sucesso", {
    stores,
    myStoreId: myStore?._id ?? null,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  });
};

export const createProductForStoreByAdmin = async (req, res, next) => {
  const { storeId } = req.params;
  const { name, description, category, highlighted, maxPerPerson, mainVariant, variants } = req.body;

  await findExistingStoreOrThrow(storeId);

  const productWithStore = await createProductForStore(storeId, {
    name,
    description,
    category,
    highlighted,
    maxPerPerson,
    mainVariant,
    variants,
  });

  return sendSuccess(res, 201, "Produto criado com sucesso", productWithStore);
};

export const deleteStoreByAdmin = async (req, res, next) => {
  const { storeId } = req.params;
  await findExistingStoreOrThrow(storeId);
  await ensureStoreHasNoActiveProducts(storeId);
  await softDeleteStore(storeId);

  return sendSuccess(res, 200, "Loja deletada com sucesso");
};

export const updateProductByAdmin = async (req, res, next) => {
  const { id } = req.params;
  const product = await findActiveProductOrThrow(id);
  const updatedProduct = await updateProductAndPopulate(product, req.body, req.user);

  return sendSuccess(res, 200, "Produto atualizado com sucesso", updatedProduct);
};

export const deleteProductByAdmin = async (req, res, next) => {
  const { id } = req.params;
  await findActiveProductOrThrow(id);
  await softDeleteProduct(id);

  return sendSuccess(res, 200, "Produto removido com sucesso");
};

export const updateStoreStatusByAdmin = async (req, res, next) => {
  const { storeId } = req.params;
  const { status } = req.body;

  const store = await findExistingStoreOrThrow(storeId);

  store.status = status;

  if (status === accountStatuses.BLOCKED) {
    store.blockedBy = req.user._id;
    store.blockedRole = req.user.role;
    store.blockedAt = new Date();
  } else {
    store.blockedBy = null;
    store.blockedRole = null;
    store.blockedAt = null;
  }

  await store.save();

  return sendSuccess(res, 200, "Status da loja atualizado com sucesso", store);
};
