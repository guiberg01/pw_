import Favorite from "../models/favorite.model.js";
import { getProduct } from "./catalog.service.js";
import { createHttpError } from "../helpers/httpError.js";

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

export const listFavoritesForUser = async (userId, query = {}) => {
  const { page, limit, skip } = normalizePagination(query);

  const [items, total] = await Promise.all([
    Favorite.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "product",
        populate: [
          {
            path: "store",
            select: "name slug owner status logoUrl",
            match: { status: "active" },
          },
          {
            path: "mainVariant",
          },
          {
            path: "productVariants",
          },
        ],
      })
      .lean(),
    Favorite.countDocuments({ user: userId }),
  ]);

  return buildPaginationResult({
    items: items
      .filter((favorite) => Boolean(favorite.product?.store))
      .map((favorite) => ({
        _id: favorite._id,
        product: favorite.product,
        createdAt: favorite.createdAt,
        updatedAt: favorite.updatedAt,
      })),
    total,
    page,
    limit,
  });
};

export const toggleFavoriteForUser = async (userId, productId) => {
  const product = await getProduct(productId);

  if (!product?.store) {
    throw createHttpError("Produto indisponível", 404, undefined, "FAVORITE_PRODUCT_NOT_FOUND");
  }

  const existing = await Favorite.findOne({ user: userId, product: productId });

  if (existing) {
    await existing.deleteOne();
    return {
      isFavorited: false,
      product,
    };
  }

  const favorite = await Favorite.create({ user: userId, product: productId });

  return {
    isFavorited: true,
    favorite,
    product,
  };
};

export const removeFavoriteForUser = async (userId, productId) => {
  const result = await Favorite.deleteOne({ user: userId, product: productId });

  return {
    deletedCount: result.deletedCount ?? 0,
  };
};
