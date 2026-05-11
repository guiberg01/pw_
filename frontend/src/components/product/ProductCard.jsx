"use client";

import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { normalizeImageSrc } from "@/lib/imageUtils";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import {
  getProductImageUrl,
  getProductPricing,
  getProductRating,
  getProductVariantSummary,
} from "@/lib/product-display";

const StarRow = ({ rating }) => {
  const fullStars = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5" aria-label={`Nota ${rating.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${star <= fullStars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
        >
          <path d="M9.999 1.5l2.57 5.205 5.744.835-4.157 4.05.981 5.72-5.138-2.703-5.138 2.703.98-5.72-4.157-4.05 5.744-.835L9.999 1.5z" />
        </svg>
      ))}
    </div>
  );
};

export default function ProductCard({ product }) {
  const router = useRouter();
  const pricing = getProductPricing(product);
  const rating = getProductRating(product);
  const variantSummary = getProductVariantSummary(product);
  const imageUrl = getProductImageUrl(product);
  const storeName = product.store?.name || product.storeName || "Loja parceira";
  const stock = Number(product.mainVariant?.stock ?? product.baseStock ?? 0);
  const hasDiscount =
    pricing.isPromotion || (pricing.previousPrice != null && pricing.previousPrice > pricing.currentPrice);
  const fallbackDiscountPercent =
    pricing.previousPrice && pricing.previousPrice > 0
      ? Math.max(1, Math.round(((pricing.previousPrice - pricing.currentPrice) / pricing.previousPrice) * 100))
      : 0;
  const discountPercent =
    pricing.isPromotion && pricing.previousPrice
      ? Math.max(1, Math.round(((pricing.previousPrice - pricing.currentPrice) / pricing.previousPrice) * 100))
      : Number(product.mainVariant?.discountPercent ?? 0);
  const shippingMessage = variantSummary.hasShippingData
    ? "Frete calculado automaticamente"
    : "Frete calculado no checkout";
  const normalizedImageUrl = normalizeImageSrc(imageUrl);

  const handleBuyNow = (e) => {
    e.stopPropagation();
    const variantId = product.mainVariant?._id || product._id;
    router.push(`/checkout?productId=${variantId}&quantity=1`);
  };

  return (
    <article
      onClick={() => router.push(`/products/${product._id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/products/${product._id}`)}
      role="link"
      tabIndex={0}
      className="group cursor-pointer flex flex-col overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
    >
      <div className="relative block aspect-4/3 w-full bg-linear-to-b from-slate-50 to-white">
        {normalizedImageUrl ? (
          <Image
            src={normalizedImageUrl}
            alt={product.name}
            fill
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">Sem imagem</div>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {product.highlighted && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-950 shadow-sm">
              Destaque
            </span>
          )}
          {variantSummary.hasMultipleOptions && (
            <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 shadow-sm">
              {variantSummary.extraVariantsCount} variações
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              -{discountPercent || fallbackDiscountPercent}%
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="space-y-0.5">
          <p className="line-clamp-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">{storeName}</p>
          <h3 className="line-clamp-2 text-[13px] font-medium leading-4 text-slate-950 group-hover:text-blue-700">
            {product.name}
          </h3>
        </div>

        {rating.hasRating ? (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <StarRow rating={rating.rating} />
            <span className="font-medium text-slate-700">{rating.rating.toFixed(1)}</span>
            <span>•</span>
            <span>{rating.ratingCount}</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">Novo no catálogo</p>
        )}

        <div className="space-y-0.5">
          {pricing.crossedPriceLabel && (
            <p className="text-[11px] text-slate-400 line-through">{pricing.crossedPriceLabel}</p>
          )}
          <div className="flex items-end gap-1">
            <span className="text-[22px] font-bold leading-none tracking-tight text-slate-950">
              {pricing.currentPriceLabel}
            </span>
          </div>
          {pricing.installmentValue > 0 && (
            <span className="text-[11px] font-medium text-emerald-600">
              em 10x de {pricing.installmentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem
              juros
            </span>
          )}
          <div className="pt-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">{shippingMessage}</span>
          </div>
        </div>

        <div className="mt-auto pt-1 flex gap-2">
          <button
            onClick={handleBuyNow}
            disabled={stock <= 0}
            className={`flex-1 h-9 rounded-md font-semibold flex items-center justify-center gap-1.5 transition duration-200 ${
              stock <= 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-yellow-400 text-[#1a4f9c] hover:bg-yellow-300 active:scale-95"
            }`}
            title="Comprar agora e ir direto para checkout"
          >
            <Zap className="h-4 w-4" />
            <span className="text-xs font-bold">Comprar</span>
          </button>
          <div onClick={(e) => e.stopPropagation()} className="flex-1">
            <AddToCartButton
              compact
              productVariantId={product.mainVariant?._id || product._id}
              stock={stock}
              maxPerPerson={product.maxPerPerson}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
