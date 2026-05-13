import {
  createCoupons,
  deleteCouponById,
  findAllCoupons,
  findCouponById,
  listCouponsForAdmin,
  updateCouponById,
} from "../services/coupon.service.js";
import { sendSuccess } from "../helpers/successResponse.js";

export const getAllCoupons = async (req, res, next) => {
  const { page, limit } = req.validatedQuery ?? {};
  const allCoupons = await findAllCoupons({ page, limit });

  return sendSuccess(res, 200, "Cupons encontrados com sucesso", allCoupons);
};

export const getCouponById = async (req, res, next) => {
  const { id } = req.params;
  const coupon = await findCouponById(id);

  return sendSuccess(res, 200, "Cupom encontrado com sucesso", coupon);
};

export const createCoupon = async (req, res, next) => {
  const coupon = await createCoupons(req.user._id, req.body);

  return sendSuccess(res, 201, "Cupom criado com sucesso", coupon);
};

export const getAllCouponsForAdmin = async (req, res, next) => {
  const { status, search, page, limit } = req.validatedQuery ?? {};
  const coupons = await listCouponsForAdmin({ status, search, page, limit });

  return sendSuccess(res, 200, "Cupons listados com sucesso", coupons);
};

export const updateCoupon = async (req, res, next) => {
  const { id } = req.params;
  const coupon = await updateCouponById(id, req.body);

  return sendSuccess(res, 200, "Cupom atualizado com sucesso", coupon);
};

export const deleteCoupon = async (req, res, next) => {
  const { id } = req.params;
  const coupon = await deleteCouponById(id);

  return sendSuccess(res, 200, "Cupom deletado com sucesso", coupon);
};
