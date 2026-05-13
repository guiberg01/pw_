import mongoose from "mongoose";
import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import OrderReview from "../models/orderReview.model.js";
import Product from "../models/product.model.js";
import Store from "../models/store.model.js";
import ProductVariant from "../models/productVariant.model.js";
import SubOrder from "../models/subOrder.model.js";
import { createHttpError } from "../helpers/httpError.js";
import { findActiveStoreByOwnerOrThrow } from "./catalog.service.js";
import {
  createNotificationForUser,
  notifyReviewCreatedForSeller,
  notifyReviewReplyForCustomer,
} from "./notification.service.js";
import { subOrderStatuses } from "../constants/subOrderStatuses.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const normalizePagination = ({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
  const normalizedPage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : DEFAULT_PAGE;
  const normalizedLimit = Number.isFinite(Number(limit))
    ? Math.min(MAX_LIMIT, Math.max(1, Number(limit)))
    : DEFAULT_LIMIT;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
};

const buildPaginationResult = ({ items, total, page, limit }) => ({
  items,
  meta: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / Math.max(limit, 1)),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});

const getSort = (sort) => {
  if (sort === "oldest") return { createdAt: 1 };
  if (sort === "highest") return { rating: -1, createdAt: -1 };
  if (sort === "lowest") return { rating: 1, createdAt: -1 };
  return { createdAt: -1 };
};

const syncProductRating = async (productId, session) => {
  try {
    const pipeline = [
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$product",
          count: { $sum: 1 },
          sum: { $sum: "$rating" },
        },
      },
    ];

    let aggregateQuery = Review.aggregate(pipeline);
    if (session) {
      aggregateQuery = aggregateQuery.session(session);
    }

    const [ratingData] = await aggregateQuery.exec();

    const ratingCount = Number(ratingData?.count ?? 0);
    const ratingSum = Number(ratingData?.sum ?? 0);

    const updateOpts = session ? { session } : {};
    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          "rating.ratingCount": ratingCount,
          "rating.ratingSum": ratingSum,
        },
      },
      updateOpts,
    );
  } catch (err) {
    console.error(`Erro ao sincronizar rating do produto ${productId}:`, err);
    throw err;
  }
};

const syncStoreReputation = async (storeId, session) => {
  try {
    const pipeline = [
      { $match: { store: new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: "$store",
          average: { $avg: "$storeRating" },
          count: { $sum: 1 },
        },
      },
    ];

    let aggregateQuery = OrderReview.aggregate(pipeline);
    if (session) {
      aggregateQuery = aggregateQuery.session(session);
    }

    const [agg] = await aggregateQuery.exec();

    const reputation = Math.round(Number(agg?.average ?? 0) * 10) / 10;

    const updateOpts = session ? { session } : {};
    await Store.updateOne({ _id: storeId }, { $set: { reputation } }, updateOpts);
  } catch (err) {
    console.error(`Erro ao sincronizar reputação da loja ${storeId}:`, err);
    throw err;
  }
};

const serializeReview = (review) => ({
  _id: review._id,
  product: review.product,
  user: review.user,
  subOrder: review.subOrder,
  rating: review.rating,
  comment: review.comment,
  images: review.images ?? [],
  videos: review.videos ?? [],
  sellerReply: review.sellerReply ?? { comment: null, repliedAt: null, editedAt: null },
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const serializeOrderReview = (review) => ({
  _id: review._id,
  order: review.order,
  subOrder: review.subOrder,
  store: review.store,
  user: review.user,
  orderRating: review.orderRating,
  storeRating: review.storeRating,
  comment: review.comment,
  images: review.images ?? [],
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const ensureReviewOwnershipOrAdmin = (review, actor) => {
  if (actor.role === "admin") return;

  if (review.user.toString() !== actor._id.toString()) {
    throw createHttpError("Acesso proibido", 403, undefined, "REVIEW_FORBIDDEN");
  }
};

const ensureSellerCanReplyOrThrow = async (review, actor) => {
  if (actor.role === "admin") return;

  if (actor.role !== "seller") {
    throw createHttpError("Acesso proibido", 403, undefined, "REVIEW_REPLY_FORBIDDEN");
  }

  const store = await findActiveStoreByOwnerOrThrow(actor._id);
  const product = await Product.findById(review.product).select("store").lean();

  if (!product || product.store?.toString() !== store._id.toString()) {
    throw createHttpError("Acesso proibido", 403, undefined, "REVIEW_REPLY_FORBIDDEN");
  }
};

const ensureReviewEligibilityOrThrow = async ({ userId, productId, subOrderId, session }) => {
  const subOrder = await SubOrder.findOne({ _id: subOrderId, status: "delivered" })
    .select("_id order items")
    .session(session)
    .lean();

  if (!subOrder) {
    throw createHttpError("Subpedido não encontrado ou não entregue", 400, undefined, "REVIEW_SUBORDER_NOT_DELIVERED");
  }

  const order = await Order.findById(subOrder.order).select("_id user").session(session).lean();

  if (!order || order.user?.toString() !== userId.toString()) {
    throw createHttpError("Subpedido não pertence ao usuário", 403, undefined, "REVIEW_SUBORDER_FORBIDDEN");
  }

  const productVariantIds = new Set(subOrder.items.map((item) => item.productVariantId.toString()));
  const hasProduct = await ProductVariant.exists({
    _id: { $in: [...productVariantIds] },
    product: productId,
  });

  if (!hasProduct) {
    const subOrderWithVariants = await SubOrder.findById(subOrderId)
      .populate({ path: "items.productVariantId", select: "product" })
      .session(session)
      .lean();

    const match = (subOrderWithVariants?.items ?? []).some(
      (item) => item.productVariantId?.product?.toString() === productId.toString(),
    );

    if (!match) {
      throw createHttpError(
        "O produto informado não pertence ao subpedido entregue",
        400,
        undefined,
        "REVIEW_PRODUCT_NOT_IN_SUBORDER",
      );
    }
  }
};

export const listProductReviews = async (productId, query = {}) => {
  const { page, limit, skip } = normalizePagination(query);
  const sort = getSort(query.sort);

  const [items, total, ratingSummary] = await Promise.all([
    Review.find({ product: productId }).sort(sort).skip(skip).limit(limit).populate("user", "name").lean(),
    Review.countDocuments({ product: productId }),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
          average: { $avg: "$rating" },
        },
      },
    ]),
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of ratingSummary) {
    breakdown[row._id] = row.count;
  }

  const average = total
    ? Object.entries(breakdown).reduce((sum, [star, count]) => sum + Number(star) * Number(count), 0) / total
    : 0;

  return {
    ...buildPaginationResult({ items: items.map(serializeReview), total, page, limit }),
    summary: {
      average: Math.round(average * 100) / 100,
      total,
      breakdown,
    },
  };
};

export const getMyReviews = async (userId, query = {}) => {
  const { page, limit, skip } = normalizePagination(query);
  const sort = getSort(query.sort);

  const [items, total] = await Promise.all([
    Review.find({ user: userId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("product", "name mainImageUrl store")
      .lean(),
    Review.countDocuments({ user: userId }),
  ]);

  return buildPaginationResult({ items: items.map(serializeReview), total, page, limit });
};

export const createReviewForUser = async (actor, payload) => {
  if (actor.role !== "customer" && actor.role !== "admin") {
    throw createHttpError("Acesso proibido", 403, undefined, "REVIEW_CREATE_FORBIDDEN");
  }

  const session = await mongoose.startSession();

  try {
    let createdReview;
    await session.withTransaction(async () => {
      // Resolve productId from payload.productId or payload.productVariantId
      let productIdToUse = payload.productId ?? null;
      if (!productIdToUse && payload.productVariantId) {
        const pv = await ProductVariant.findById(payload.productVariantId).select("product").session(session).lean();
        productIdToUse = pv?.product ?? null;
      }

      if (!productIdToUse) {
        throw createHttpError("productId or productVariantId is required", 400, undefined, "REVIEW_MISSING_PRODUCT");
      }

      await ensureReviewEligibilityOrThrow({
        userId: actor._id,
        productId: productIdToUse,
        subOrderId: payload.subOrderId,
        session,
      });

      const existing = await Review.findOne({
        user: actor._id,
        product: productIdToUse,
        subOrder: payload.subOrderId,
      })
        .session(session)
        .lean();

      if (existing) {
        throw createHttpError("Review já cadastrada para este pedido", 409, undefined, "REVIEW_ALREADY_EXISTS");
      }

      const [review] = await Review.create(
        [
          {
            product: productIdToUse,
            user: actor._id,
            subOrder: payload.subOrderId,
            rating: payload.rating,
            comment: payload.comment ?? "",
            images: payload.images ?? [],
            videos: payload.videos ?? [],
          },
        ],
        { session },
      );

      await syncProductRating(payload.productId, session);
      createdReview = review;
    });

    const serialized = serializeReview(createdReview.toObject());

    await notifyReviewCreatedForSeller({
      productId: payload.productId,
      reviewId: serialized._id,
      rating: serialized.rating,
    });

    return serialized;
  } finally {
    await session.endSession();
  }
};

export const updateOwnReview = async (actor, reviewId, payload) => {
  const session = await mongoose.startSession();

  try {
    let updated;
    await session.withTransaction(async () => {
      const review = await Review.findById(reviewId).session(session);
      if (!review) {
        throw createHttpError("Review não encontrada", 404, undefined, "REVIEW_NOT_FOUND");
      }

      ensureReviewOwnershipOrAdmin(review, actor);

      if (payload.rating !== undefined) review.rating = payload.rating;
      if (payload.comment !== undefined) review.comment = payload.comment;
      if (payload.images !== undefined) review.images = payload.images;
      if (payload.videos !== undefined) review.videos = payload.videos;

      await review.save({ session });
      await syncProductRating(review.product, session);
      updated = review;
    });

    return serializeReview(updated.toObject());
  } finally {
    await session.endSession();
  }
};

export const deleteOwnReview = async (actor, reviewId) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const review = await Review.findById(reviewId).session(session);
      if (!review) {
        throw createHttpError("Review não encontrada", 404, undefined, "REVIEW_NOT_FOUND");
      }

      ensureReviewOwnershipOrAdmin(review, actor);
      const productId = review.product;
      await review.deleteOne({ session });
      await syncProductRating(productId, session);
    });
  } finally {
    await session.endSession();
  }
};

export const listStoreProductReviews = async (actor, query = {}) => {
  const store = await findActiveStoreByOwnerOrThrow(actor._id);

  const { page, limit, skip } = normalizePagination(query);
  const sort = getSort(query.sort);

  const productIds = await Product.find({ store: store._id }).distinct("_id");
  const search = query.search?.trim();

  const pipeline = [
    { $match: { product: { $in: productIds } } },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
  ];

  if (search) {
    const regex = { $regex: search, $options: "i" };
    pipeline.push({
      $match: {
        $or: [
          { comment: regex },
          { "sellerReply.comment": regex },
          { "product.name": regex },
          { "user.name": regex },
          { "user.email": regex },
        ],
      },
    });
  }

  const itemsPipeline = [{ $sort: sort }, { $skip: skip }, { $limit: limit }];

  const [result] = await Review.aggregate([
    ...pipeline,
    {
      $facet: {
        items: [
          ...itemsPipeline,
          {
            $project: {
              _id: 1,
              product: {
                _id: "$product._id",
                name: "$product.name",
                mainImageUrl: "$product.mainImageUrl",
              },
              user: {
                _id: "$user._id",
                name: "$user.name",
              },
              subOrder: 1,
              rating: 1,
              comment: 1,
              images: 1,
              videos: 1,
              sellerReply: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        total: [{ $count: "value" }],
        replyStats: [
          {
            $group: {
              _id: null,
              replied: {
                $sum: {
                  $cond: [{ $ifNull: ["$sellerReply.comment", false] }, 1, 0],
                },
              },
              pending: {
                $sum: {
                  $cond: [{ $ifNull: ["$sellerReply.comment", false] }, 0, 1],
                },
              },
            },
          },
        ],
        breakdown: [
          {
            $group: {
              _id: "$rating",
              count: { $sum: 1 },
            },
          },
        ],
        average: [
          {
            $group: {
              _id: null,
              average: { $avg: "$rating" },
            },
          },
        ],
      },
    },
  ]);

  const total = result?.total?.[0]?.value ?? 0;
  const replyStats = result?.replyStats?.[0] ?? { replied: 0, pending: 0 };
  const average = result?.average?.[0]?.average ?? 0;
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const row of result?.breakdown ?? []) {
    breakdown[row._id] = row.count;
  }

  return {
    ...buildPaginationResult({
      items: (result?.items ?? []).map((item) => ({
        ...item,
        sellerReply: item.sellerReply ?? { comment: null, repliedAt: null, editedAt: null },
      })),
      total,
      page,
      limit,
    }),
    summary: {
      average: Math.round(Number(average || 0) * 100) / 100,
      total,
      replied: replyStats.replied ?? 0,
      pending: replyStats.pending ?? 0,
      breakdown,
    },
  };
};

export const listStoreOrderReviews = async (actor, query = {}) => {
  const store = await findActiveStoreByOwnerOrThrow(actor._id);

  const { page, limit, skip } = normalizePagination(query);
  const sort = getSort(query.sort);
  const search = query.search?.trim();

  const pipeline = [{ $match: { store: store._id } }];

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
  );

  if (search) {
    const regex = { $regex: search, $options: "i" };
    pipeline.push({
      $match: {
        $or: [{ comment: regex }, { "user.name": regex }, { "user.email": regex }],
      },
    });
  }

  const [result] = await OrderReview.aggregate([
    ...pipeline,
    {
      $facet: {
        items: [
          { $sort: sort },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              order: 1,
              subOrder: 1,
              store: 1,
              user: {
                _id: "$user._id",
                name: "$user.name",
                email: "$user.email",
              },
              orderRating: 1,
              storeRating: 1,
              comment: 1,
              images: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        total: [{ $count: "value" }],
        averageStore: [{ $group: { _id: null, average: { $avg: "$storeRating" } } }],
        averageOrder: [{ $group: { _id: null, average: { $avg: "$orderRating" } } }],
        breakdown: [{ $group: { _id: "$storeRating", count: { $sum: 1 } } }],
      },
    },
  ]);

  const total = result?.total?.[0]?.value ?? 0;
  const averageStore = result?.averageStore?.[0]?.average ?? 0;
  const averageOrder = result?.averageOrder?.[0]?.average ?? 0;
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const row of result?.breakdown ?? []) {
    breakdown[row._id] = row.count;
  }

  return {
    ...buildPaginationResult({ items: result?.items ?? [], total, page, limit }),
    summary: {
      averageStore: Math.round(Number(averageStore || 0) * 100) / 100,
      averageOrder: Math.round(Number(averageOrder || 0) * 100) / 100,
      total,
      breakdown,
    },
  };
};

export const upsertReviewReply = async (actor, reviewId, comment) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw createHttpError("Review não encontrada", 404, undefined, "REVIEW_NOT_FOUND");
  }

  await ensureSellerCanReplyOrThrow(review, actor);

  review.sellerReply = {
    comment,
    repliedAt: review.sellerReply?.repliedAt ?? new Date(),
    editedAt: review.sellerReply?.comment ? new Date() : null,
  };

  await review.save();
  await notifyReviewReplyForCustomer({
    userId: review.user,
    reviewId: review._id,
    productId: review.product,
  });

  return serializeReview(review.toObject());
};

export const deleteReviewReply = async (actor, reviewId) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw createHttpError("Review não encontrada", 404, undefined, "REVIEW_NOT_FOUND");
  }

  await ensureSellerCanReplyOrThrow(review, actor);

  review.sellerReply = {
    comment: null,
    repliedAt: null,
    editedAt: null,
  };

  await review.save();
  return serializeReview(review.toObject());
};

export const getAdminReviews = async (query = {}) => {
  const { page, limit, skip } = normalizePagination(query);
  const sort = getSort(query.sort);

  const [items, total] = await Promise.all([
    Review.find({})
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("product", "name")
      .populate("user", "name email role")
      .lean(),
    Review.countDocuments({}),
  ]);

  return buildPaginationResult({ items: items.map(serializeReview), total, page, limit });
};

export const listMyOrderReviewsForUser = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId }).select("_id").lean();

  if (!order) {
    throw createHttpError("Pedido não encontrado", 404, undefined, "ORDER_NOT_FOUND");
  }

  const reviews = await OrderReview.find({ order: order._id, user: userId }).sort({ createdAt: 1 }).lean();

  return reviews.map(serializeOrderReview);
};

export const createOrderReviewForUser = async (actor, payload) => {
  const order = await Order.findOne({ _id: payload.orderId, user: actor._id }).select("_id user").lean();

  if (!order) {
    throw createHttpError("Pedido não encontrado", 404, undefined, "ORDER_NOT_FOUND");
  }

  const subOrder = await SubOrder.findOne({ _id: payload.subOrderId, order: order._id })
    .populate({ path: "store", select: "_id owner name" })
    .select("_id order store status")
    .lean();

  if (!subOrder) {
    throw createHttpError("Subpedido não encontrado", 404, undefined, "ORDER_REVIEW_SUBORDER_NOT_FOUND");
  }

  if (subOrder.status !== subOrderStatuses.DELIVERED) {
    throw createHttpError(
      "A review só pode ser enviada após a entrega do subpedido",
      409,
      undefined,
      "ORDER_REVIEW_SUBORDER_NOT_DELIVERED",
    );
  }

  const existing = await OrderReview.findOne({
    order: order._id,
    user: actor._id,
    subOrder: subOrder._id,
  }).lean();

  if (existing) {
    throw createHttpError("Review já cadastrada para este subpedido", 409, undefined, "ORDER_REVIEW_ALREADY_EXISTS");
  }

  const [createdReview] = await OrderReview.create([
    {
      order: order._id,
      subOrder: subOrder._id,
      store: subOrder.store?._id ?? subOrder.store,
      user: actor._id,
      orderRating: payload.orderRating,
      storeRating: payload.storeRating,
      comment: payload.comment ?? "",
      images: payload.images ?? [],
    },
  ]);
  // Atualiza reputação da loja com base nas avaliações de pedido
  try {
    const storeId = subOrder.store?._id ?? subOrder.store;
    if (storeId) {
      await syncStoreReputation(storeId);
    }
  } catch (err) {
    // não bloqueia criação de review em caso de falha na atualização da reputação
    console.error("Erro ao sincronizar reputação da loja:", err);
  }

  // Se houver avaliação para produto no payload (productId ou productVariantId), crie também a Review do produto
  const productVariantId = payload.productVariantId ?? null;
  let productIdToUse = payload.productId ?? null;

  if (!productIdToUse && productVariantId) {
    try {
      const pv = await ProductVariant.findById(productVariantId).select("product").lean();
      productIdToUse = pv?.product ?? null;
    } catch (err) {
      console.error("Erro ao buscar productVariant para derivar productId:", err);
      productIdToUse = null;
    }
  }

  if (productIdToUse && payload.productRating !== undefined) {
    try {
      await ensureReviewEligibilityOrThrow({
        userId: actor._id,
        productId: productIdToUse,
        subOrderId: subOrder._id,
      });

      const existingProductReview = await Review.findOne({
        user: actor._id,
        product: productIdToUse,
        subOrder: subOrder._id,
      }).lean();

      if (!existingProductReview) {
        const [createdProductReview] = await Review.create([
          {
            product: productIdToUse,
            user: actor._id,
            subOrder: subOrder._id,
            rating: payload.productRating,
            comment: payload.comment ?? "",
            images: payload.images ?? [],
          },
        ]);

        try {
          await syncProductRating(productIdToUse);
        } catch (err) {
          console.error("Erro ao sincronizar rating do produto:", err);
        }
      }
    } catch (err) {
      // não bloqueia criação da order review se falhar criação do review de produto
      console.error("Erro ao criar review de produto associada:", err);
    }
  }

  const storeOwnerId = subOrder.store?.owner?._id ?? subOrder.store?.owner ?? null;
  if (storeOwnerId) {
    await createNotificationForUser(storeOwnerId, {
      title: "Nova avaliação recebida",
      message: `O pedido #${String(order._id).slice(-6)} recebeu uma avaliação da loja e do pedido.`,
      type: "review_received",
      recipientRole: "seller",
      actionUrl: "/seller/reviews",
      refModel: { refId: createdReview._id, refModel: "SubOrder" },
      metadata: {
        orderId: order._id.toString(),
        subOrderId: subOrder._id.toString(),
        orderRating: createdReview.orderRating,
        storeRating: createdReview.storeRating,
      },
    });
  }

  return serializeOrderReview(createdReview.toObject());
};
