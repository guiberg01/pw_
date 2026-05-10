import { z } from "zod";

const urlSchema = z.string().trim().url("URL inválida");

const titleSchema = z.string().trim().min(1, "Título é obrigatório");

const statusSchema = z.enum(["active", "inactive"]).optional().default("active");

const displayOrderSchema = z.preprocess((val) => {
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  }
  return val;
}, z.number().int().min(0, "Ordem deve ser um número não negativo").optional());

export const createBannerSchema = z.object({
  imageUrl: urlSchema,
  linkUrl: urlSchema,
  title: titleSchema,
  status: statusSchema,
  displayOrder: displayOrderSchema,
});

export const updateBannerSchema = createBannerSchema.partial();
