import { sendSuccess } from "../helpers/successResponse.js";
import {
  addProductToCartForRequest,
  applyCouponForRequest,
  clearCartForRequest,
  decrementProductForRequest,
  getCartForRequest,
  removeCouponForRequest,
  removeProductFromCartForRequest,
  updateProductQuantityForRequest,
} from "../services/cart.service.js";

export const getCart = async (req, res, next) => {
  const response = await getCartForRequest(req, res);

  return sendSuccess(res, 200, "Carrinho encontrado com sucesso", response);
};

export const addToCart = async (req, res, next) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;
  console.debug && console.debug("cart.addToCart request", { productId, quantity, params: req.params, body: req.body });
  const response = await addProductToCartForRequest(req, res, productId, quantity);

  return sendSuccess(res, 200, "Produto adicionado ao carrinho com sucesso", response);
};

export const updateCartItem = async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const response = await updateProductQuantityForRequest(req, res, productId, quantity);

  return sendSuccess(res, 200, "Item do carrinho atualizado com sucesso", response);
};

export const removeCartItemByProduct = async (req, res, next) => {
  const { productId } = req.params;
  const response = await removeProductFromCartForRequest(req, res, productId);

  return sendSuccess(res, 200, "Item removido do carrinho com sucesso", response);
};

export const removeAllCart = async (req, res, next) => {
  const response = await clearCartForRequest(req, res);

  return sendSuccess(res, 200, "Carrinho esvaziado com sucesso", response);
};

export const decrementCartItem = async (req, res, next) => {
  const { productId } = req.params;
  const response = await decrementProductForRequest(req, res, productId);

  return sendSuccess(res, 200, "Item do carrinho decrementado com sucesso", response);
};

export const applyCartCoupon = async (req, res, next) => {
  const { couponCode } = req.body;
  const response = await applyCouponForRequest(req, res, couponCode);

  return sendSuccess(res, 200, "Cupom aplicado ao carrinho com sucesso", response);
};

export const removeCartCoupon = async (req, res, next) => {
  const response = await removeCouponForRequest(req, res);

  return sendSuccess(res, 200, "Cupom removido do carrinho com sucesso", response);
};
