import fs from "fs/promises";
import path from "path";
import Banner from "../models/banner.model.js";
import { createHttpError } from "../helpers/httpError.js";
import { getUploadDirectoryPath } from "../config/upload.js";

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
  };
};

const buildPagination = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});

const isManagedUploadUrl = (imageUrl) => {
  if (!imageUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    return parsedUrl.pathname.startsWith("/uploads/");
  } catch {
    return imageUrl.startsWith("/uploads/");
  }
};

const resolveManagedUploadPath = (imageUrl) => {
  if (!isManagedUploadUrl(imageUrl)) {
    return null;
  }

  const uploadsDirectory = getUploadDirectoryPath();

  try {
    const parsedUrl = new URL(imageUrl);
    const fileName = path.basename(parsedUrl.pathname);
    return path.join(uploadsDirectory, fileName);
  } catch {
    const fileName = path.basename(imageUrl);
    return path.join(uploadsDirectory, fileName);
  }
};

const removeManagedImageFileIfPresent = async (imageUrl) => {
  const filePath = resolveManagedUploadPath(imageUrl);

  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};

const normalizeBannerPayload = (payload = {}) => {
  const normalized = {};

  if (payload.imageUrl !== undefined) {
    normalized.imageUrl = String(payload.imageUrl).trim();
  }

  if (payload.linkUrl !== undefined) {
    normalized.linkUrl = String(payload.linkUrl).trim();
  }

  if (payload.title !== undefined) {
    normalized.title = String(payload.title).trim();
  }

  if (payload.status !== undefined) {
    normalized.status = payload.status;
  }

  if (payload.displayOrder !== undefined) {
    normalized.displayOrder = Number(payload.displayOrder);
  }

  return normalized;
};

export const listBannersForAdmin = async ({ status, page, limit } = {}) => {
  const pagination = normalizePagination({ page, limit });
  const filter = {};

  if (status) {
    filter.status = status;
  }

  const skip = (pagination.page - 1) * pagination.limit;

  const [items, total] = await Promise.all([
    Banner.find(filter).sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(pagination.limit),
    Banner.countDocuments(filter),
  ]);

  return {
    items,
    pagination: buildPagination(total, pagination.page, pagination.limit),
  };
};

export const listPublicBanners = async ({ page, limit } = {}) => {
  const pagination = normalizePagination({ page, limit });
  const filter = { status: "active" };
  const skip = (pagination.page - 1) * pagination.limit;

  const [items, total] = await Promise.all([
    Banner.find(filter).sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(pagination.limit),
    Banner.countDocuments(filter),
  ]);

  return {
    items,
    pagination: buildPagination(total, pagination.page, pagination.limit),
  };
};

export const findBannerByIdOrThrow = async (bannerId, { includeDeleted = false } = {}) => {
  const filter = includeDeleted ? { _id: bannerId, includeDeleted: true } : { _id: bannerId };
  const banner = await Banner.findOne(filter);

  if (!banner) {
    throw createHttpError("Banner não encontrado", 404, undefined, "BANNER_NOT_FOUND");
  }

  return banner;
};

export const createBanner = async (payload) => {
  const bannerData = normalizeBannerPayload(payload);

  return Banner.create(bannerData);
};

export const updateBannerById = async (bannerId, payload) => {
  const banner = await findBannerByIdOrThrow(bannerId, { includeDeleted: true });
  const previousImageUrl = banner.imageUrl;
  const normalizedPayload = normalizeBannerPayload(payload);

  Object.assign(banner, normalizedPayload);

  await banner.save();

  if (normalizedPayload.imageUrl && normalizedPayload.imageUrl !== previousImageUrl) {
    await removeManagedImageFileIfPresent(previousImageUrl);
  }

  return banner;
};

export const softDeleteBannerById = async (bannerId) => {
  const banner = await findBannerByIdOrThrow(bannerId, { includeDeleted: true });

  if (banner.deletedAt !== null) {
    throw createHttpError("Banner já está deletado", 400, undefined, "BANNER_ALREADY_DELETED");
  }

  banner.deletedAt = new Date();
  await banner.save();

  await removeManagedImageFileIfPresent(banner.imageUrl);

  return banner;
};
