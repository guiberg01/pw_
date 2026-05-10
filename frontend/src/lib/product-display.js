import { formatCurrency } from "@/lib/utils";

export const getProductImageUrl = (product) =>
  product?.mainVariant?.imageUrl || product?.mainImageUrl || product?.imageUrl || "";

export const getProductCategory = (product) => {
  const category = Array.isArray(product?.category) ? product.category[0] : product?.category;

  if (!category) {
    return { key: "uncategorized", label: "Sem categoria" };
  }

  if (typeof category === "string") {
    return { key: category, label: category };
  }

  return {
    key: category._id || category.slug || category.name || "uncategorized",
    label: category.name || "Sem categoria",
  };
};

export const getProductPricing = (product) => {
  const mainVariant = product?.mainVariant || {};
  const basePrice = Number(mainVariant.price ?? product?.basePrice ?? 0);
  const previousPrice = mainVariant.previousPrice != null ? Number(mainVariant.previousPrice) : null;
  const promoPrice = mainVariant.salePrice != null ? Number(mainVariant.salePrice) : null;
  const isPromotion =
    Boolean(mainVariant.onPromotion && promoPrice != null) || (promoPrice != null && promoPrice < basePrice);
  const currentPrice = isPromotion ? (promoPrice ?? basePrice) : basePrice;
  const crossedPrice = isPromotion ? (previousPrice ?? basePrice) : previousPrice;
  const installmentValue = currentPrice > 0 ? currentPrice / 10 : 0;

  return {
    basePrice,
    previousPrice: crossedPrice,
    currentPrice,
    promoPrice,
    isPromotion,
    installmentValue,
    currentPriceLabel: formatCurrency(currentPrice),
    crossedPriceLabel: crossedPrice != null ? formatCurrency(crossedPrice) : "",
  };
};

export const getProductRating = (product) => {
  const rating = Number(product?.rating?.average ?? 0);
  const ratingCount = Number(product?.rating?.ratingCount ?? 0);

  return {
    rating,
    ratingCount,
    hasRating: ratingCount > 0,
  };
};

export const getProductVariantSummary = (product) => {
  const mainVariant = product?.mainVariant || {};
  const extraVariants = Array.isArray(product?.productVariants) ? product.productVariants : [];
  const totalVariants = 1 + extraVariants.length;
  const hasShippingData =
    [mainVariant.weight, mainVariant.length, mainVariant.width, mainVariant.height].some(
      (value) => value != null && value !== "",
    ) ||
    extraVariants.some((variant) =>
      [variant.weight, variant.length, variant.width, variant.height].some((value) => value != null && value !== ""),
    );

  return {
    totalVariants,
    extraVariantsCount: extraVariants.length,
    hasShippingData,
    hasMultipleOptions: extraVariants.length > 0,
    hasPromotionBadge:
      Boolean(mainVariant.onPromotion && mainVariant.salePrice != null) ||
      (mainVariant.salePrice != null &&
        Number(mainVariant.salePrice) < Number(mainVariant.price ?? product?.basePrice ?? 0)),
  };
};
