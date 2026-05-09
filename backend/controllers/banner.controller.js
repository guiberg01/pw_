import { sendSuccess } from "../helpers/successResponse.js";
import {
  createBanner as createBannerInService,
  findBannerByIdOrThrow,
  listBannersForAdmin,
  listPublicBanners,
  softDeleteBannerById,
  updateBannerById,
} from "../services/banner.service.js";

export const getAllBanners = async (req, res, next) => {
  const { status, page = 1, limit = 20 } = req.validatedQuery ?? req.query ?? {};

  const result = await listBannersForAdmin({ status, page, limit });

  return sendSuccess(res, 200, "Banners listados com sucesso", {
    items: result.items,
    pagination: result.pagination,
  });
};

export const getPublicBanners = async (req, res, next) => {
  const { page = 1, limit = 20 } = req.validatedQuery ?? req.query ?? {};

  const result = await listPublicBanners({ page, limit });

  return sendSuccess(res, 200, "Banners listados com sucesso", {
    items: result.items,
    pagination: result.pagination,
  });
};

export const getBannerById = async (req, res, next) => {
  const { id } = req.params;

  const banner = await findBannerByIdOrThrow(id, { includeDeleted: true });

  return sendSuccess(res, 200, "Banner encontrado com sucesso", banner);
};

export const createBanner = async (req, res, next) => {
  const banner = await createBannerInService(req.body);

  return sendSuccess(res, 201, "Banner criado com sucesso", banner);
};

export const updateBanner = async (req, res, next) => {
  const { id } = req.params;

  const updated = await updateBannerById(id, req.body);

  return sendSuccess(res, 200, "Banner atualizado com sucesso", updated);
};

export const deleteBanner = async (req, res, next) => {
  const { id } = req.params;

  await softDeleteBannerById(id);

  return sendSuccess(res, 200, "Banner removido com sucesso");
};
