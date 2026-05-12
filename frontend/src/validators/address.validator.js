import { z } from "zod";

const labelSchema = z.string().trim().optional().or(z.literal(""));

const receiverNameSchema = z.string().trim().min(1, "Destinatário é obrigatório");

const phoneNumberSchema = z
  .string()
  .transform((val) => val.replace(/[^\d]+/g, ""))
  .superRefine((val, ctx) => {
    if (val.length < 10 || val.length > 11) {
      ctx.addIssue({
        code: z.custom,
        message: "Telefone inválido. Deve ter 10 ou 11 dígitos.",
      });
    }
  });

const zipCodeSchema = z
  .string()
  .trim()
  .refine((val) => val.trim().length > 0, "CEP é obrigatório")
  .refine((val) => /^\d{5}-?\d{3}$/.test(val.replace(/[^\d]/g, "")), "CEP inválido. Deve conter 8 dígitos.");

const streetSchema = z.string().trim().min(1, "Rua é obrigatória");

const numberSchema = z.string().trim().min(1, "Número é obrigatório");

const complementSchema = z.string().trim().optional().or(z.literal(""));

const neighborhoodSchema = z.string().trim().min(1, "Bairro é obrigatório");

const citySchema = z.string().trim().min(1, "Cidade é obrigatória");

const stateSchema = z
  .string()
  .trim()
  .min(2, "Estado deve ter 2 caracteres")
  .max(2, "Estado deve ter 2 caracteres")
  .transform((val) => val.toUpperCase());

export const addressSchema = z.object({
  label: labelSchema,
  receiverName: receiverNameSchema,
  phoneNumber: phoneNumberSchema,
  zipCode: zipCodeSchema,
  street: streetSchema,
  number: numberSchema,
  complement: complementSchema,
  neighborhood: neighborhoodSchema,
  city: citySchema,
  state: stateSchema,
  isDefault: z.boolean().optional().default(false),
});
