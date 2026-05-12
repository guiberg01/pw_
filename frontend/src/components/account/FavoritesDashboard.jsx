"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Heart, RefreshCw, ShoppingBag, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmActionDialog from "@/components/ui/confirm-action-dialog";
import { favoriteService } from "@/services/favoriteService";
import {
  AccountEmptyState,
  AccountPageHero,
  AccountPagination,
  AccountSectionCard,
  AccountStatGrid,
  getToneClass,
} from "./AccountPrimitives";
import { formatCurrency } from "@/lib/formatters";
import { normalizeImageSrc } from "@/lib/imageUtils";

export default function FavoritesDashboard() {
  const [data, setData] = useState({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [removingFavorite, setRemovingFavorite] = useState(null);

  const loadFavoritesRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await favoriteService.getMyFavorites({ page });
        if (!ignore) setData(response);
      } catch (err) {
        if (!ignore) {
          const message = err?.response?.data?.message || "Não foi possível carregar seus favoritos.";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadFavoritesRef.current = loadFavorites;
    void loadFavoritesRef.current();

    return () => {
      ignore = true;
    };
  }, [page]);

  const favorites = useMemo(() => data.items ?? [], [data.items]);
  const pagination = useMemo(() => data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }, [data.meta]);

  const stats = useMemo(() => {
    const currentPageItems = favorites.length;
    const productCount = favorites.filter((favorite) => Boolean(favorite.product)).length;

    return [
      { label: "Favoritos no total", value: pagination.total ?? 0, helper: "Itens salvos no backend" },
      { label: "Exibidos na página", value: currentPageItems, helper: "Página atual" },
      { label: "Produtos válidos", value: productCount, helper: "Com dados completos" },
      { label: "Ações rápidas", value: "Remover / abrir", helper: "Organize sua lista" },
    ];
  }, [favorites, pagination.total]);

  const handleRemoveFavorite = async () => {
    if (!removingFavorite?.product?._id) return;

    await favoriteService.removeFavorite(removingFavorite.product._id);
    toast.success("Produto removido dos favoritos");
    setRemovingFavorite(null);
    await loadFavorites();
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <AccountPageHero
          eyebrow="Favoritos"
          title="Produtos salvos"
          description="Mantenha seus itens preferidos organizados e remova o que não faz mais sentido para você."
          actions={
            <Button
              className="text-blue-400 bg-transparent border border-blue-400 absolute top-2 right-2 hover:bg-transparent transition-shadow hover:shadow-[inset_0_-4px_8px_rgba(59,130,246,0.4)] hover:text-blue-300 hover:border-blue-300"
              variant="outline"
              onClick={() => void loadFavoritesRef.current?.()}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          }
        />

        <AccountStatGrid stats={stats} />

        <AccountSectionCard
          title="Lista de favoritos"
          description="Veja os produtos salvos diretamente do banco e mantenha sua coleção limpa."
        >
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : error && favorites.length === 0 ? (
            <AccountEmptyState
              title="Não foi possível carregar seus favoritos"
              description={error}
              actionLabel="Recarregar"
              onAction={() => void loadFavoritesRef.current?.()}
              icon={Heart}
            />
          ) : favorites.length === 0 ? (
            <AccountEmptyState
              title="Sua lista está vazia"
              description="Salve produtos para acompanhar promoções, comparar opções e voltar depois com mais rapidez."
              actionLabel="Explorar produtos"
              actionHref="/products"
              icon={ShoppingBag}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {favorites.map((favorite) => {
                  const product = favorite.product ?? {};
                  const mainVariant = product.mainVariant ?? null;
                  const currentPrice = mainVariant?.price ?? product.basePrice ?? 0;
                  const displayPrice =
                    mainVariant?.onPromotion && mainVariant?.salePrice != null ? mainVariant.salePrice : currentPrice;

                  return (
                    <Card key={favorite._id} className="overflow-hidden border-slate-200 bg-white shadow-sm">
                      <div className="relative aspect-square bg-slate-100">
                        <Link
                          href={product._id ? `/products/${product._id}` : "/products"}
                          className="block h-full w-full"
                        >
                          <Image
                            src={normalizeImageSrc(product.mainImageUrl || "/placeholder-product.png")}
                            alt={product.name || "Produto"}
                            fill
                            className="object-cover transition duration-300 hover:scale-105"
                          />
                        </Link>
                      </div>
                      <CardContent className="space-y-4 p-4">
                        <div className="space-y-2">
                          <Link href={product._id ? `/products/${product._id}` : "/products"} className="block">
                            <h3 className="line-clamp-2 text-lg font-bold text-slate-950 hover:text-blue-700">
                              {product.name || "Produto"}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className={`rounded-full px-3 py-1 font-semibold ${getToneClass("info")}`}>
                              {product.store?.name || "Loja"}
                            </span>
                            <span className={`rounded-full px-3 py-1 font-semibold ${getToneClass("success")}`}>
                              <Star className="mr-1 inline h-3 w-3" />
                              {product.rating?.average ?? 0}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Preço</div>
                          <div className="text-2xl font-black text-slate-950">{formatCurrency(displayPrice)}</div>
                        </div>

                        <div className="flex gap-2">
                          <Button asChild className="flex-1">
                            <Link href={product._id ? `/products/${product._id}` : "/products"}>Ver produto</Link>
                          </Button>
                          <Button variant="destructive" onClick={() => setRemovingFavorite(favorite)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <AccountPagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </AccountSectionCard>
      </div>

      <ConfirmActionDialog
        open={Boolean(removingFavorite)}
        onOpenChange={(open) => {
          if (!open) setRemovingFavorite(null);
        }}
        title="Remover favorito"
        description={`Deseja remover ${removingFavorite?.product?.name || "este produto"} dos favoritos?`}
        confirmLabel="Remover"
        onConfirm={handleRemoveFavorite}
      />
    </main>
  );
}
