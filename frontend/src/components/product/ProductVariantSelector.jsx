"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatCurrency } from "@/lib/formatters";

export function ProductVariantSelector({ variants = [], maxPerPerson = null }) {
  const normalizedVariants = variants.filter(Boolean);
  const [selectedId, setSelectedId] = useState(normalizedVariants[0]?._id ?? null);

  if (normalizedVariants.length === 0) {
    return null;
  }

  const selectedVariant = normalizedVariants.find((variant) => variant._id === selectedId) || normalizedVariants[0];
  const stock = Number(selectedVariant?.stock ?? 0);

  return (
    <div className="space-y-4">
      {normalizedVariants.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">Variações</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {normalizedVariants.map((variant) => {
              const isActive = variant._id === selectedVariant._id;

              return (
                <button
                  key={variant._id}
                  type="button"
                  onClick={() => setSelectedId(variant._id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    isActive ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{variant.sku || "Variação"}</div>
                      <div className="text-xs text-slate-500">{Number(variant.stock ?? 0)} em estoque</div>
                    </div>
                    <div className="text-sm font-bold">{formatCurrency(Number(variant.price ?? 0))}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AddToCartButton productVariantId={selectedVariant._id} stock={stock} maxPerPerson={maxPerPerson} />
    </div>
  );
}
