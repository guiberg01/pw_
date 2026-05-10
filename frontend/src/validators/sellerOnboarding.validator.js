import { z } from "zod";

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

const addressSchema = z.object({
  zipCode: z
    .string()
    .trim()
    .min(8, "CEP inválido")
    .refine((value) => stripBrazilianDocument(value).length === 8, {
      message: "CEP inválido",
    }),
  street: z.string().trim().min(1, "Rua é obrigatória"),
  number: z.string().trim().min(1, "Número é obrigatório"),
  complement: z.string().trim().max(120, "Complemento muito longo").optional().or(z.literal("")),
  neighborhood: z.string().trim().min(1, "Bairro é obrigatório"),
  city: z.string().trim().min(1, "Cidade é obrigatória"),
  state: z
    .string()
    .trim()
    .min(2, "UF inválida")
    .max(2, "UF inválida")
    .transform((value) => value.toUpperCase()),
  receiverName: z.string().trim().min(1, "Nome do responsável é obrigatório"),
  phoneNumber: z
    .string()
    .trim()
    .min(8, "Telefone inválido")
    .refine(
      (value) => {
        const digits = stripBrazilianDocument(value);
        return digits.length >= 10 && digits.length <= 11;
      },
      { message: "Telefone inválido" },
    ),
});

export const createSellerStoreSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja"),
  description: z.string().trim().max(600, "Descrição muito longa").optional().or(z.literal("")),
  cnpj: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidCnpj(value), {
      message: "CNPJ inválido",
    }),
  logoUrl: z.string().trim().min(1, "Envie a logo da loja"),
  bannerUrl: z.string().trim().min(1, "Envie o banner da loja"),
  address: addressSchema,
});
