import { z } from "zod";

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

export const orderReviewFormSchema = z.object({
  orderRating: z.coerce.number().int().min(1, "Informe uma nota para o pedido").max(5, "Nota inválida"),
  storeRating: z.coerce.number().int().min(1, "Informe uma nota para a loja").max(5, "Nota inválida"),
  comment: z.string().trim().max(2000, "O comentário deve ter no máximo 2000 caracteres").optional().default(""),
  images: reviewMediaSchema,
});
