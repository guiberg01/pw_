import { z } from "zod";

const parseNumber = (value) => {
  if (value === "" || value == null) return undefined;
  const normalized = typeof value === "string" ? value.replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : value;
};

const optionalNonNegativeNumber = z.preprocess(
  parseNumber,
  z.number().min(0, "Informe um valor maior ou igual a zero").optional().nullable(),
);

const requiredPositiveNumber = z.preprocess(parseNumber, z.number().positive("Informe um valor maior que zero"));

const requiredStockNumber = z.preprocess(
  parseNumber,
  z.number().int("Estoque deve ser inteiro").min(0, "Estoque deve ser maior ou igual a zero"),
);

const normalizeAttributes = (value) => {
  if (typeof value !== "string") return {};
  const text = value.trim();
  if (!text) return {};

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed)
          .map(([key, val]) => [String(key).trim(), String(val ?? "").trim()])
          .filter(([key, val]) => key && val),
      );
    }
  } catch {
    // fallback abaixo
  }

  return Object.fromEntries(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [rawKey, ...rawValue] = line.split(":");
        return [String(rawKey ?? "").trim(), String(rawValue.join(":") ?? "").trim()];
      })
      .filter(([key, val]) => key && val),
  );
};

const variantSchema = z
  .object({
    attributesText: z.string().optional().default(""),
    price: requiredPositiveNumber,
    stock: requiredStockNumber,
    sku: z
      .string()
      .trim()
      .min(1, "SKU é obrigatório")
      .transform((value) => value.toUpperCase()),
    imageUrl: z.string().trim().url("A imagem deve ser uma URL válida"),
    datasheet: z.string().trim().optional().or(z.literal("")),
    weight: optionalNonNegativeNumber,
    length: optionalNonNegativeNumber,
    width: optionalNonNegativeNumber,
    height: optionalNonNegativeNumber,
    onPromotion: z.boolean().optional().default(false),
    salePrice: optionalNonNegativeNumber,
    discountPercent: optionalNonNegativeNumber,
  })
  .superRefine((value, ctx) => {
    if (value.onPromotion) {
      if (value.salePrice == null && value.discountPercent == null) {
        ctx.addIssue({
          code: "custom",
          path: ["salePrice"],
          message: "Informe preço promocional ou desconto percentual",
        });
      }

      if (value.salePrice != null && value.salePrice >= value.price) {
        ctx.addIssue({
          code: "custom",
          path: ["salePrice"],
          message: "Preço promocional deve ser menor que o preço base",
        });
      }
    }
  });

export const createSellerProductFormSchema = z
  .object({
    name: z.string().trim().min(1, "Nome é obrigatório"),
    description: z.string().trim().min(1, "Descrição é obrigatória"),
    category: z
      .string()
      .trim()
      .regex(/^[a-f\d]{24}$/i, "Categoria inválida"),
    highlighted: z.boolean().optional().default(false),
    maxPerPerson: z.preprocess(
      parseNumber,
      z.number().int("Limite deve ser inteiro").min(1, "Limite deve ser ao menos 1").optional().nullable(),
    ),
    mainVariant: variantSchema,
    variants: z.array(variantSchema).optional().default([]),
  })
  .superRefine((value, ctx) => {
    const skus = [value.mainVariant.sku, ...value.variants.map((item) => item.sku)].filter(Boolean);

    if (new Set(skus).size !== skus.length) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Não repita SKU entre variações",
      });
    }

    if (value.maxPerPerson != null && value.maxPerPerson > value.mainVariant.stock) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPerPerson"],
        message: "Limite por pessoa não pode ser maior que o estoque da variação principal",
      });
    }
  });

const normalizeOptionalText = (value) => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length ? normalized : undefined;
};

const normalizeOptionalNumber = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return value;
};

const mapVariantToPayload = (variant) => ({
  attributes: normalizeAttributes(variant.attributesText),
  price: variant.price,
  stock: variant.stock,
  sku: variant.sku,
  imageUrl: variant.imageUrl,
  datasheet: normalizeOptionalText(variant.datasheet),
  weight: normalizeOptionalNumber(variant.weight),
  length: normalizeOptionalNumber(variant.length),
  width: normalizeOptionalNumber(variant.width),
  height: normalizeOptionalNumber(variant.height),
  onPromotion: Boolean(variant.onPromotion),
  salePrice: normalizeOptionalNumber(variant.salePrice),
  discountPercent: normalizeOptionalNumber(variant.discountPercent),
});

export const mapSellerProductFormToPayload = (values) => ({
  name: values.name.trim(),
  description: values.description.trim(),
  category: values.category,
  highlighted: Boolean(values.highlighted),
  maxPerPerson: values.maxPerPerson ?? undefined,
  mainVariant: mapVariantToPayload(values.mainVariant),
  variants: (values.variants ?? []).map(mapVariantToPayload),
});

export const createEmptyVariantForm = () => ({
  attributesText: "",
  price: "",
  stock: "",
  sku: "",
  imageUrl: "",
  datasheet: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  onPromotion: false,
  salePrice: "",
  discountPercent: "",
});

export const createSellerProductDefaultValues = () => ({
  name: "",
  description: "",
  category: "",
  highlighted: false,
  maxPerPerson: "",
  mainVariant: createEmptyVariantForm(),
  variants: [],
});
