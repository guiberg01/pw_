import { z } from "zod";
import { mongoIdSchema } from "./common.validator.js";

const toNumber = (val) => {
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  }
  return val;
};

export const createBannerSchema = z.object({
  imageUrl: z.string().trim().url("URL de imagem inválida"),
  linkUrl: z.string().trim().url("URL de link inválida"),
  title: z.string().trim().min(1, "Título é obrigatório"),
  status: z.enum(["active", "inactive"]).optional(),
  displayOrder: z.preprocess(toNumber, z.number().int().min(0).optional()),
});

export const updateBannerSchema = createBannerSchema.partial();

export const bannerParamsSchema = z.object({
  id: mongoIdSchema,
});

export const listBannersQuerySchema = z.object({
  status: z.enum(["active", "inactive"]).optional(),
  page: z.preprocess(toNumber, z.number().int().min(1).optional()),
  limit: z.preprocess(toNumber, z.number().int().min(1).max(100).optional()),
});
