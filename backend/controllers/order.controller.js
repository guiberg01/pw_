import { sendSuccess } from "../helpers/successResponse.js";
import {
  findOrderByIdForUserOrThrow,
  listOrdersForUser,
  cancelOrderForUserOrThrow,
  confirmOrderReceivedForUser,
} from "../services/order.service.js";

export const getMyOrders = async (req, res, next) => {
  const { page, limit, status, createdFrom, createdTo, sort } = req.validatedQuery ?? {};
  const orders = await listOrdersForUser(req.user._id, { page, limit, status, createdFrom, createdTo, sort });

  return sendSuccess(res, 200, "Pedidos listados com sucesso", orders);
};

export const getMyOrderById = async (req, res, next) => {
  const { id } = req.params;
  const order = await findOrderByIdForUserOrThrow(id, req.user._id);

  return sendSuccess(res, 200, "Pedido encontrado com sucesso", order);
};

export const cancelMyOrder = async (req, res, next) => {
  const { id } = req.params;
  const order = await cancelOrderForUserOrThrow(id, req.user._id);

  return sendSuccess(res, 200, "Pedido cancelado com sucesso", order);
};

export const confirmMyOrderReceipt = async (req, res, next) => {
  const { id } = req.params;
  const { subOrderId = null } = req.validatedBody ?? {};
  const order = await confirmOrderReceivedForUser(id, req.user._id, { subOrderId });

  return sendSuccess(res, 200, "Pedido confirmado como recebido", order);
};
