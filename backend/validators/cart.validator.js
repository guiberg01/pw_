import { z } from "zod";
import { mongoIdSchema } from "./common.validator.js";

export const cartItemParamsSchema = z.object({
  productId: mongoIdSchema,
});

export const addCartItemSchema = z.object({
  quantity: z.number().int().min(1, "A quantidade deve ser pelo menos 1").optional().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "A quantidade deve ser pelo menos 1"),
});

export const applyCartCouponSchema = z.object({
  couponCode: z
    .string()
    .trim()
    .min(1, "Código do cupom inválido")
    .max(50, "Código do cupom inválido")
    .transform((value) => value.toUpperCase()),
});
