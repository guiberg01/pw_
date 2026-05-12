import { z } from "zod";
import { mongoIdSchema } from "./common.validator.js";

export const favoriteProductIdParamSchema = z.object({
  productId: mongoIdSchema,
});

export const favoriteListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
