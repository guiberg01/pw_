import { z } from "zod";
import { mongoIdSchema } from "./common.validator.js";
import { paginationQuerySchema } from "./product.validator.js";
import { accountStatuses } from "../constants/accountStatuses.js";

const stripBrazilianDocument = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .trim();

const isValidCnpj = (value) => {
  const cnpj = stripBrazilianDocument(value);

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (base, factors) => {
    let total = 0;
    for (let index = 0; index < base.length; index += 1) {
      total += Number(base[index]) * factors[index];
    }

    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calcDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
};

const optionalCnpjSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || isValidCnpj(value), {
    message: "CNPJ inválido",
  });

export const createStoreSchema = z.object({
  name: z.string().trim().min(1, "Nome da loja é obrigatório"),
  description: z.string().trim().optional().default(""),
  cnpj: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || isValidCnpj(v), {
      message: "CNPJ inválido",
    }),
  logoUrl: z
    .string()
    .trim()
    .pipe(z.url({ error: "A logo deve ser uma URL válida" }))
    .optional()
    .default(""),
  bannerUrl: z
    .string()
    .trim()
    .pipe(z.url({ error: "O banner deve ser uma URL válida" }))
    .optional()
    .default(""),
  // endereço é obrigatório na criação da loja
  addressId: mongoIdSchema,
});

export const updateMyStoreSchema = z
  .object({
    name: z.string().trim().min(1, "Nome da loja é obrigatório").optional(),
    description: z.string().trim().optional(),
    cnpj: optionalCnpjSchema,
    logoUrl: z
      .string()
      .trim()
      .pipe(z.url({ error: "A logo deve ser uma URL válida" }))
      .optional(),
    bannerUrl: z
      .string()
      .trim()
      .pipe(z.url({ error: "O banner deve ser uma URL válida" }))
      .optional(),
    addressId: mongoIdSchema.optional(),
    visibility: z
      .object({
        showOwnerName: z.boolean().optional(),
        showVisitCount: z.boolean().optional(),
        showDescription: z.boolean().optional(),
        showLocation: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envie ao menos um campo para atualização",
  });

export const updateMyStoreStatusSchema = z.object({
  status: z.enum([accountStatuses.ACTIVE, accountStatuses.SUSPENDED]),
});

export const updateStoreStatusByAdminSchema = z.object({
  status: z.enum(Object.values(accountStatuses)),
});

export const storeIdParamSchema = z.object({
  storeId: mongoIdSchema,
});

export const storeListQuerySchema = paginationQuerySchema.extend({
  categoryId: mongoIdSchema.optional(),
});

export const stripeOnboardingLinkSchema = z.object({
  refreshUrl: z
    .string()
    .trim()
    .pipe(z.url({ error: "Refresh URL inválida" })),
  returnUrl: z
    .string()
    .trim()
    .pipe(z.url({ error: "Return URL inválida" })),
});
