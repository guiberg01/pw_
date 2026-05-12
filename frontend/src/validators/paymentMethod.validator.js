import { z } from "zod";

const paymentMethodTypeSchema = z.enum(["card", "bank_account"]).optional().default("card");

const cardBrandSchema = z.string().trim().optional().or(z.literal(""));

const last4Schema = z
  .string()
  .trim()
  .regex(/^\d{0,4}$/, "Deve conter apenas até 4 dígitos");

const expMonthSchema = z
  .number()
  .int("Mês deve ser um número inteiro")
  .min(1, "Mês deve ser entre 1 e 12")
  .max(12, "Mês deve ser entre 1 e 12")
  .optional()
  .or(z.literal(null));

const expYearSchema = z
  .number()
  .int("Ano deve ser um número inteiro")
  .min(2000, "Ano deve ser 2000 ou maior")
  .max(2100, "Ano deve ser 2100 ou menor")
  .optional()
  .or(z.literal(null));

export const paymentMethodSchema = z.object({
  // gerado pelo stripe
  type: paymentMethodTypeSchema,
  cardBrand: cardBrandSchema,
  last4: last4Schema,
  expMonth: expMonthSchema,
  expYear: expYearSchema,
  isDefault: z.boolean().optional().default(false),
});

// tudo read only
export const paymentMethodDisplaySchema = z.object({
  _id: z.string(),
  stripePaymentMethodId: z.string(),
  type: paymentMethodTypeSchema,
  cardBrand: cardBrandSchema,
  last4: last4Schema,
  expMonth: expMonthSchema,
  expYear: expYearSchema,
  isDefault: z.boolean(),
  createdAt: z.string().optional(),
});
