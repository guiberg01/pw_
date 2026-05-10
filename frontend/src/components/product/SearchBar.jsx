"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export default function SearchBar({ allProducts = [], value = "", onValueChange }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!value) {
        setSuggestions([]);
        return;
      }

      const q = value.toLowerCase();
      const found = allProducts
        .filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
        .slice(0, 6);
      setSuggestions(found);
    }, 220);

    return () => clearTimeout(id);
  }, [value, allProducts]);

  const hasSuggestions = suggestions && suggestions.length > 0;

  return (
    <div className="relative h-full">
      <Input
        placeholder="Buscar por produto, marca ou SKU..."
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="w-full h-full rounded-full border-slate-300 bg-white px-4 py-2 shadow-sm"
      />

      {hasSuggestions && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {suggestions.map((s) => (
            <button
              key={`${s._id || s._localId || s.name}-${s.sku || "suggestion"}`}
              type="button"
              onClick={() => {
                onValueChange?.(s.name || "");
                setSuggestions([]);
              }}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span className="line-clamp-1 font-medium text-slate-900">{s.name}</span>
              <span className="shrink-0 text-xs text-slate-500">
                {s.sku ? `SKU ${s.sku}` : s.mainVariant?.sku ? `SKU ${s.mainVariant.sku}` : "Ver produto"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
