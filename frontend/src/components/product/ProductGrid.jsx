"use client";

import ProductCard from "./ProductCard";

export default function ProductGrid({ products, loading = false }) {
  if (loading && (!products || products.length === 0)) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Carregando produtos...
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Nenhum produto encontrado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id || p._localId} product={p} />
      ))}
    </div>
  );
}
