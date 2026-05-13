"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductGrid from "./ProductGrid";
import { getProductCategory, getProductPricing } from "@/lib/product-display";
import { categoryService } from "@/services/categoryService";

export default function ProductListClient({
  initialProducts = [],
  fetcher = null,
  initialCategoryId = "",
  initialPromotion = false,
  syncToUrl = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts || []);
  const [category, setCategory] = useState(initialCategoryId || "");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [onlyHighlighted, setOnlyHighlighted] = useState(false);
  const [onlyPromotion, setOnlyPromotion] = useState(initialPromotion || false);
  const [sortBy, setSortBy] = useState("relevance");
  const [isLoading, setIsLoading] = useState(Boolean(fetcher));

  useEffect(() => {
    if (!fetcher) return;

    let mounted = true;
    (async () => {
      try {
        const res = await fetcher();
        if (mounted && Array.isArray(res)) setProducts(res);
      } catch (e) {
        console.error("fetcher error", e);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetcher]);

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const categories = await categoryService.getActiveCategories({ page: 1, limit: 200 });
        if (!mounted) return;

        const normalized = (categories || [])
          .map((item) => ({
            key: item?._id || item?.id || item?.slug || item?.name,
            label: item?.name || "Sem nome",
          }))
          .filter((item) => Boolean(item.key));

        setCategoryOptions(normalized);
      } catch (error) {
        if (!mounted) return;
        setCategoryOptions([]);
      }
    };

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!syncToUrl) return;

    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (category) {
        nextParams.set("categoryId", category);
      } else {
        nextParams.delete("categoryId");
      }

      if (onlyPromotion) {
        nextParams.set("promotion", "true");
      } else {
        nextParams.delete("promotion");
      }

      nextParams.delete("page");

      const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
      const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [syncToUrl, category, onlyPromotion, pathname, router, searchParams]);

  const categories = useMemo(() => {
    if (categoryOptions.length > 0) {
      return categoryOptions;
    }

    const map = new Map();

    products.forEach((product) => {
      const categoryData = getProductCategory(product);
      if (!map.has(categoryData.key)) {
        map.set(categoryData.key, categoryData.label);
      }
    });

    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [categoryOptions, products]);

  const filtered = useMemo(() => {
    const normalized = products.filter((product) => {
      const productCategory = getProductCategory(product);
      const matchesCategory = !category || String(productCategory.key) === String(category);
      const matchesFeatured = !onlyHighlighted || Boolean(product.highlighted);

      const pricing = getProductPricing(product);
      const hasDiscount = Boolean(pricing.isPromotion);
      const matchesPromotion = !onlyPromotion || hasDiscount;

      return matchesCategory && matchesFeatured && matchesPromotion;
    });

    return [...normalized].sort((a, b) => {
      const priceA = Number(a.mainVariant?.price ?? a.basePrice ?? 0);
      const priceB = Number(b.mainVariant?.price ?? b.basePrice ?? 0);

      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;

      const featuredA = Boolean(a.highlighted);
      const featuredB = Boolean(b.highlighted);
      if (featuredA !== featuredB) return featuredA ? -1 : 1;

      return (
        Number(b.createdAt ? new Date(b.createdAt).getTime() : 0) -
        Number(a.createdAt ? new Date(a.createdAt).getTime() : 0)
      );
    });
  }, [products, category, onlyHighlighted, onlyPromotion, sortBy]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Mais relevantes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </div>

          <label className="flex h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={onlyHighlighted}
              onChange={(e) => setOnlyHighlighted(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Somente destaques
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{isLoading ? "Carregando produtos..." : `${filtered.length} produto(s) encontrado(s)`}</span>
        {(category || onlyHighlighted || onlyPromotion) && (
          <button
            type="button"
            onClick={() => {
              setCategory("");
              setOnlyHighlighted(false);
              setOnlyPromotion(false);
              setSortBy("relevance");
            }}
            className="font-medium text-blue-600 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <ProductGrid products={filtered} loading={isLoading} />
    </div>
  );
}
