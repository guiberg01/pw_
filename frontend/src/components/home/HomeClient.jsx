"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Store, Compass } from "lucide-react";
import { productService } from "@/services/productService";
import { storeService } from "@/services/storeService";
import ProductCard from "@/components/product/ProductCard";
import { BannerSection } from "@/components/home/BannerSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ProductHorizontalSection = ({ title, icon: Icon, products, isLoading, seeMoreLink }) => {
  const scrollContainerRef = useRef(null);
  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-8 space-y-4 relative group">
      <div className="flex items-center justify-between px-4 md:px-0">
        <h2 className="text-2xl font-brand font-black text-[#1a4f9c] flex items-center gap-2">
          {Icon && <Icon className="text-yellow-500" size={24} />}
          {title}
        </h2>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {seeMoreLink && (
            <Link
              href={seeMoreLink}
              className="text-sm whitespace-nowrap self-center font-bold text-[#1a4f9c] hover:text-blue-800 hover:underline transition-colors"
            >
              Ver mais
            </Link>
          )}
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex rounded-full h-8 w-8 shadow-sm"
            onClick={() => scroll("left")}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex rounded-full h-8 w-8 shadow-sm"
            onClick={() => scroll("right")}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 md:px-0 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading
          ? Array(5)
              .fill(0)
              .map((_, i) => <div key={i} className="min-w-[280px] h-[380px] bg-slate-100 animate-pulse rounded-xl" />)
          : products.map((product) => (
              <div key={product._id} className="min-w-[280px] max-w-[280px]">
                <ProductCard product={product} />
              </div>
            ))}
      </div>
    </section>
  );
};

export default function HomeClient({ isAdmin }) {
  const [highlights, setHighlights] = useState([]);
  const [storeInfo, setStoreInfo] = useState({ id: "", name: "", products: [] });
  const [explore, setExplore] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      try {
        const allProducts = (await productService.getAllProducts({ limit: 50 })) || [];

        const highlightsArray = allProducts.filter((product) => product.highlighted === true).slice(0, 10); // Pega no máximo 10

        setHighlights(highlightsArray);

        const storesData = await storeService.getAllStores({ limit: 1 });
        const storesArray = Array.isArray(storesData) ? storesData : storesData?.stores || [];

        if (storesArray.length > 0) {
          const targetStore = storesArray[0];

          const storeProductsArray = allProducts
            .filter((product) => {
              const productStoreId = typeof product.store === "object" ? product.store?._id : product.store;
              return String(productStoreId) === String(targetStore._id);
            })
            .slice(0, 10);

          setStoreInfo({
            id: targetStore._id,
            name: targetStore.name,
            products: storeProductsArray,
          });
        }

        setExplore(allProducts.slice(0, 12));
      } catch (error) {
        console.error("Erro ao carregar dados da home:", error);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <BannerSection isAdmin={isAdmin} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <ProductHorizontalSection
          title="Destaques"
          seeMoreLink="/products?promotion=true"
          icon={Sparkles}
          products={highlights}
          isLoading={loading}
        />

        {storeInfo.products.length > 0 && (
          <ProductHorizontalSection
            title={`Produtos de ${storeInfo.name}`}
            icon={Store}
            products={storeInfo.products}
            isLoading={loading}
            seeMoreLink={`/stores/${storeInfo.id}`}
          />
        )}

        <div className="py-8 space-y-6">
          <div className="flex items-center justify-between px-4 md:px-0">
            <h2 className="text-2xl font-brand font-black text-[#1a4f9c] flex items-center gap-2">
              <Compass className="text-yellow-500" size={24} /> Explorar
            </h2>

            <Link
              href="/products"
              className="text-sm font-bold text-[#1a4f9c] hover:text-blue-800 hover:underline transition-colors"
            >
              Ver mais
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading
              ? Array(8)
                  .fill(0)
                  .map((_, i) => <div key={i} className="h-[400px] bg-slate-100 animate-pulse rounded-xl" />)
              : explore.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div>
      </div>
    </main>
  );
}
