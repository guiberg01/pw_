import { z } from "zod";
import { mongoIdSchema } from "./common.validator.js";
import { paginationQuerySchema } from "./product.validator.js";

const positiveIntFromQuery = (defaultValue) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return defaultValue;
    if (typeof value === "string") return Number.parseInt(value, 10);
    return value;
  }, z.number().int().min(1));

export const couponIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const couponListQuerySchema = paginationQuerySchema;

export const couponAdminListQuerySchema = z.object({
  status: z.enum(["active", "inactive", "expired", "sold-out", "deleted"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: positiveIntFromQuery(1),
  limit: positiveIntFromQuery(20).refine((value) => value <= 100, {
    message: "O limite máximo por página é 100",
  }),
});

const couponSchemaShape = {
  code: z
    .string()
    .trim()
    .min(1, "Código de cupom é obrigatório")
    .transform((value) => value.toUpperCase()),
  discountType: z.enum(["percentage", "fixed"], {
    error: "Tipo de desconto deve ser porcentagem ou fixo",
  }),
  discountValue: z.number().positive("Valor do desconto deve ser maior que zero"),
  minOrderValue: z.number().min(0, "Valor mínimo do pedido deve ser zero ou positivo").optional(),
  maxUses: z.number().int().positive("Número máximo de usos deve ser um inteiro positivo").optional(),
  maxDiscountAmount: z.number().min(0, "O valor máximo de desconto deve ser zero ou positivo").optional(),
  maxUsesPerUser: z
    .number()
    .int()
    .positive("Número máximo de usos por usuário deve ser um inteiro positivo")
    .optional(),
  expiresAt: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      error: "Data de expiração deve ser no futuro",
    })
    .optional(),
  products: z.array(mongoIdSchema).optional(),
  stores: z.array(mongoIdSchema).optional(),
  categories: z.array(mongoIdSchema).optional(),
  status: z.enum(["active", "inactive", "expired", "sold-out"]).optional(),
};

const couponRefine = (data, ctx) => {
  if (data.discountType === "percentage" && data.discountValue > 100) {
    ctx.addIssue({
      code: "custom",
      path: ["discountValue"],
      error: "Desconto percentual não pode ultrapassar 100%",
    });
  }

  if (
    typeof data.maxUses === "number" &&
    typeof data.maxUsesPerUser === "number" &&
    data.maxUsesPerUser > data.maxUses
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["maxUsesPerUser"],
      error: "Uso máximo por usuário não pode ser maior que o uso máximo total",
    });
  }
};

export const createCouponSchema = z.object(couponSchemaShape).superRefine(couponRefine);

export const updateCouponSchema = z
  .object(couponSchemaShape)
  .partial()
  .superRefine(couponRefine)
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envie ao menos um campo para atualização",
  });
