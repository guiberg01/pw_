"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
  const pricing = getProductPricing(product);
  const rating = getProductRating(product);
  const variantSummary = getProductVariantSummary(product);
  const imageUrl = getProductImageUrl(product);
  const category = Array.isArray(product.category) ? product.category[0] : product.category;
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

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
      <Link href={`/products/${product._id}`} className="relative block aspect-square w-full bg-slate-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">Sem imagem</div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.highlighted && (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-950 shadow-sm">
              Destaque
            </span>
          )}
          {variantSummary.hasMultipleOptions && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-800 shadow-sm">
              {variantSummary.extraVariantsCount} variações
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              -{discountPercent || fallbackDiscountPercent}%
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-slate-500 line-clamp-1">{storeName}</p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 group-hover:text-blue-700">
            {product.name}
          </h3>
        </div>

        {rating.hasRating ? (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <StarRow rating={rating.rating} />
            <span>{rating.rating.toFixed(1)}</span>
            <span>•</span>
            <span>{rating.ratingCount} avaliações</span>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Produto novo no catálogo</p>
        )}

        <div className="space-y-1">
          {pricing.crossedPriceLabel && (
            <p className="text-xs text-slate-400 line-through">{pricing.crossedPriceLabel}</p>
          )}
          <div className="flex items-end">
            <span className="text-2xl font-bold tracking-tight text-slate-950">{pricing.currentPriceLabel}</span>
          </div>
          {pricing.installmentValue > 0 && (
            <span className=" text-[11px] font-medium text-emerald-600">
              em 10x de {pricing.installmentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem
              juros
            </span>
          )}
          <div className="flex pt-2 flex-wrap items-center gap-2 text-[11px] text-slate-500">
            {category?.name && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{category.name}</span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{shippingMessage}</span>
            {stock > 0 ? (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{stock} em estoque</span>
            ) : (
              <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-600">Sem estoque</span>
            )}
          </div>
        </div>

        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="h-10 rounded-full border-slate-200 bg-white text-slate-800">
            <Link href={`/products/${product._id}`}>Ver detalhes</Link>
          </Button>
          <Button asChild className="h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700">
            <Link href={`/products/${product._id}`}>Comprar agora</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
