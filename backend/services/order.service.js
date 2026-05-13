import Order from "../models/order.model.js";
import SubOrder from "../models/subOrder.model.js";
import Payment from "../models/payment.model.js";
import Shipping from "../models/shipping.model.js";
import mongoose from "mongoose";
import { createHttpError } from "../helpers/httpError.js";
import { reconcileCheckoutOrderPaymentForUser, getStripeClientOrThrow } from "./checkout.service.js";
import { buildPaginationResult, buildPaymentView, groupByOrderId } from "../helpers/orderView.helper.js";
import { orderStatuses } from "../constants/orderStatuses.js";
import { subOrderStatuses } from "../constants/subOrderStatuses.js";
import { shippingStatuses } from "../constants/shippingStatuses.js";

const tryAutoReconcilePendingOrderPayment = async ({ orderId, userId, status }) => {
  if (status !== orderStatuses.PENDING) {
    return false;
  }

  try {
    await reconcileCheckoutOrderPaymentForUser(userId, orderId);
    return true;
  } catch (error) {
    // Reconciliação é fallback: erros não devem bloquear a consulta do pedido.
    console.warn(
      `[Order] Falha ao reconciliar pagamento pendente (orderId=${orderId}, userId=${userId}): ${error?.message ?? "erro desconhecido"}`,
    );
    return false;
  }
};

const attachOrderRelations = ({ orders, subOrders, payments }) => {
  const subOrdersByOrderId = groupByOrderId(subOrders);
  const paymentsByOrderId = groupByOrderId(payments);

  return orders.map((order) => {
    const orderId = order._id.toString();
    const paymentView = buildPaymentView(paymentsByOrderId.get(orderId) ?? []);

    return {
      ...order,
      subOrders: subOrdersByOrderId.get(orderId) ?? [],
      ...paymentView,
    };
  });
};

export const listOrdersForUser = async (
  userId,
  { page = 1, limit = 20, status, createdFrom, createdTo, sort = "newest" } = {},
) => {
  const filters = { user: userId };

  if (status) {
    filters.status = status;
  }

  if (createdFrom || createdTo) {
    filters.createdAt = {};

    if (createdFrom) {
      filters.createdAt.$gte = createdFrom;
    }

    if (createdTo) {
      filters.createdAt.$lte = createdTo;
    }
  }

  const sortByCreatedAt = sort === "oldest" ? 1 : -1;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filters).sort({ createdAt: sortByCreatedAt }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filters),
  ]);

  if (orders.length === 0) {
    return buildPaginationResult([], total, page, limit);
  }

  const pendingOrders = orders.filter((order) => order.status === orderStatuses.PENDING);
  if (pendingOrders.length > 0) {
    await Promise.allSettled(
      pendingOrders.map((order) =>
        tryAutoReconcilePendingOrderPayment({
          orderId: order._id,
          userId,
          status: order.status,
        }),
      ),
    );

    const refreshedOrders = await Order.find({ _id: { $in: orders.map((order) => order._id) } }).lean();
    const refreshedById = new Map(refreshedOrders.map((order) => [order._id.toString(), order]));
    for (let index = 0; index < orders.length; index += 1) {
      const refreshed = refreshedById.get(orders[index]._id.toString());
      if (refreshed) {
        orders[index] = refreshed;
      }
    }
  }

  const orderIds = orders.map((order) => order._id);

  const [subOrders, payments] = await Promise.all([
    SubOrder.find({ order: { $in: orderIds } })
      .sort({ createdAt: 1 })
      .select("order store items subTotal shippingCost discountAmount vendorNetAmount status")
      .populate("store", "name slug logoUrl status")
      .lean(),
    Payment.find({ order: { $in: orderIds } })
      .select(
        "order status amount currency paymentMethod paidAt refundedAmount createdAt updatedAt stripePaymentIntentId stripeChargeId",
      )
      .lean(),
  ]);

  const items = attachOrderRelations({ orders, subOrders, payments });

  return buildPaginationResult(items, total, page, limit);
};

export const findOrderByIdForUserOrThrow = async (orderId, userId) => {
  let order = await Order.findOne({ _id: orderId, user: userId }).lean();

  if (!order) {
    throw createHttpError("Pedido não encontrado", 404, undefined, "ORDER_NOT_FOUND");
  }

  await tryAutoReconcilePendingOrderPayment({
    orderId: order._id,
    userId,
    status: order.status,
  });

  order = (await Order.findOne({ _id: orderId, user: userId }).lean()) ?? order;

  const [subOrders, payments] = await Promise.all([
    SubOrder.find({ order: order._id })
      .sort({ createdAt: 1 })
      .select("order store items coupon shipping subTotal shippingCost discountAmount vendorNetAmount status")
      .populate({
        path: "shipping",
        select: "_id trackingCode labelUrl carrier whoPays estimatedDeliveryDate status history createdAt updatedAt",
      })
      .populate("store", "name slug logoUrl status")
      .lean(),
    Payment.find({ order: order._id })
      .select(
        "order status amount currency paymentMethod paidAt refundedAmount createdAt updatedAt stripePaymentIntentId stripeChargeId",
      )
      .lean(),
  ]);

  const paymentView = buildPaymentView(payments);

  return {
    ...order,
    subOrders,
    ...paymentView,
  };
};

export const cancelOrderForUserOrThrow = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });

  if (!order) {
    throw createHttpError("Pedido não encontrado", 404, undefined, "ORDER_NOT_FOUND");
  }

  if (order.status !== orderStatuses.PENDING) {
    throw createHttpError(
      `Não é possível cancelar um pedido com status "${order.status}"`,
      400,
      undefined,
      "ORDER_CANNOT_BE_CANCELLED",
    );
  }

  const payment = await Payment.findOne({ order: order._id });
  if (payment && payment.status === "pending") {
    if (payment.stripePaymentIntentId) {
      try {
        const stripe = getStripeClientOrThrow();
        await stripe.paymentIntents.cancel(payment.stripePaymentIntentId);
      } catch (error) {
        console.warn(
          `[Order] Falha ao cancelar PaymentIntent no Stripe (paymentId=${payment._id}): ${error?.message ?? "erro desconhecido"}`,
        );
      }
    }

    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: { status: "cancelled" },
        $push: {
          events: {
            type: "payment_cancelled",
            at: new Date(),
            metadata: { reason: "user_requested_order_cancellation" },
          },
        },
      },
    );
  }

  await Order.updateOne({ _id: order._id }, { $set: { status: orderStatuses.CANCELLED } });

  await SubOrder.updateMany(
    { order: order._id, status: { $ne: subOrderStatuses.CANCELLED } },
    { $set: { status: subOrderStatuses.CANCELLED } },
  );

  return findOrderByIdForUserOrThrow(orderId, userId);
};

export const confirmOrderReceivedForUser = async (orderId, userId, { subOrderId = null } = {}) => {
  const order = await Order.findOne({ _id: orderId, user: userId }).select("_id user status").lean();

  if (!order) {
    throw createHttpError("Pedido não encontrado", 404, undefined, "ORDER_NOT_FOUND");
  }

  const subOrderFilters = {
    order: order._id,
    status: subOrderStatuses.SHIPPING,
  };

  if (subOrderId) {
    subOrderFilters._id = subOrderId;
  }

  const targetSubOrders = await SubOrder.find(subOrderFilters).select("_id order status shipping").lean();

  if (targetSubOrders.length === 0) {
    throw createHttpError(
      "Nenhum subpedido em trânsito está disponível para confirmação",
      409,
      undefined,
      "ORDER_RECEIPT_NOT_AVAILABLE",
    );
  }

  const targetSubOrderIds = targetSubOrders.map((subOrder) => subOrder._id);
  const shippingDocs = await Shipping.find({ subOrder: { $in: targetSubOrderIds } });
  const shippingBySubOrderId = new Map(shippingDocs.map((shipping) => [String(shipping.subOrder), shipping]));

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      for (const subOrder of targetSubOrders) {
        const shipping = shippingBySubOrderId.get(String(subOrder._id));
        if (shipping && shipping.status !== shippingStatuses.DELIVERED) {
          shipping.status = shippingStatuses.DELIVERED;
          shipping.history.push({
            timestamp: new Date(),
            status: shippingStatuses.DELIVERED,
            description: "Pedido confirmado como recebido pelo cliente",
          });
          await shipping.save({ session });
        }
      }

      await SubOrder.updateMany(
        { _id: { $in: targetSubOrderIds } },
        { $set: { status: subOrderStatuses.DELIVERED } },
        { session },
      );

      await Order.updateOne({ _id: order._id }, { $set: { status: orderStatuses.PAID } }, { session });
    });
  } finally {
    await session.endSession();
  }

  return findOrderByIdForUserOrThrow(orderId, userId);
};
