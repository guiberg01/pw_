"use client";

import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/formatters";
import { ShoppingCart } from "lucide-react";

export function CartSummary() {
  const { itemCount, totalPrice, loading, error } = useCart();

  if (loading) {
    return (
      <div className="rounded-lg bg-slate-100 p-4 border border-slate-200 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 bg-slate-300 rounded w-3/4"></div>
          <div className="h-4 bg-slate-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">Resumo do Carrinho</h3>
      </div>

      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-sm text-slate-600">Itens:</dt>
          <dd className="font-medium text-slate-900">{itemCount}</dd>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200">
          <dt className="text-sm font-medium text-slate-900">Total:</dt>
          <dd className="text-lg font-bold text-blue-600">{formatCurrency(totalPrice)}</dd>
        </div>
      </dl>
    </div>
  );
}
