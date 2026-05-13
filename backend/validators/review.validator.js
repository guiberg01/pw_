import { z } from "zod";
import { mongoIdSchema } from "./common.validator.js";
import { paginationQuerySchema } from "./product.validator.js";

const reviewMediaSchema = z
  .array(
    z
      .string()
      .trim()
      .pipe(z.url({ error: "URL inválida" })),
  )
  .max(10)
  .optional()
  .default([]);

export const reviewIdParamSchema = z.object({
  id: mongoIdSchema,
});

export const productReviewParamSchema = z.object({
  productId: mongoIdSchema,
});

export const productReviewListQuerySchema = paginationQuerySchema.extend({
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).optional().default("newest"),
  search: z.string().trim().min(1).optional(),
});

export const createReviewSchema = z
  .object({
    productId: mongoIdSchema.optional(),
    productVariantId: mongoIdSchema.optional(),
    subOrderId: mongoIdSchema,
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional().default(""),
    images: reviewMediaSchema,
    videos: reviewMediaSchema,
  })
  .refine((payload) => payload.productId || payload.productVariantId, {
    message: "Informe productId ou productVariantId",
  });

export const updateReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(2000).optional(),
    images: z
      .array(
        z
          .string()
          .trim()
          .pipe(z.url({ error: "URL inválida" })),
      )
      .max(10)
      .optional(),
    videos: z
      .array(
        z
          .string()
          .trim()
          .pipe(z.url({ error: "URL inválida" })),
      )
      .max(10)
      .optional(),
  })
  .refine(
    (payload) =>
      payload.rating !== undefined ||
      payload.comment !== undefined ||
      payload.images !== undefined ||
      payload.videos !== undefined,
    { message: "Envie ao menos um campo para atualizar" },
  );

export const upsertSellerReplySchema = z.object({
  comment: z.string().trim().min(1).max(2000),
});

export const orderReviewListParamSchema = z.object({
  orderId: mongoIdSchema,
});

export const createOrderReviewSchema = z.object({
  orderId: mongoIdSchema,
  subOrderId: mongoIdSchema,
  orderRating: z.coerce.number().int().min(1).max(5),
  storeRating: z.coerce.number().int().min(1).max(5),
  productId: mongoIdSchema.optional(),
  productVariantId: mongoIdSchema.optional(),
  productRating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(2000).optional().default(""),
  images: reviewMediaSchema,
});
