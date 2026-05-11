"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Star, MapPin, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storeDetailService } from "@/services/storeDetailService";
import ProductListClient from "@/components/product/ProductListClient";
import { normalizeImageSrc } from "@/lib/imageUtils";

export default function StoreDetail() {
  const params = useParams();
  const storeId = params.storeId;

  const [storeData, setStoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoreData = useCallback(async () => {
    try {
      setIsLoading(true);
      const storeResponse = await storeDetailService.getStoreById(storeId);
      setStoreData(storeResponse);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  const loadStoreProducts = useCallback(async () => {
    // Filtrar apenas produtos desta loja
    const response = await storeDetailService.getStoreProducts({ page: 1, limit: 100 });
    const allProducts = response?.items ?? [];
    return allProducts.filter((p) => p.store?._id === storeId);
  }, [storeId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadStoreData();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadStoreData]);

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-slate-50 flex items-center justify-center px-4 py-14">
        <div className="flex items-center gap-3 text-slate-700">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Carregando loja...</span>
        </div>
      </main>
    );
  }

  if (!storeData) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-950">Loja não encontrada</h1>
            <p className="text-slate-600">A loja que você está procurando não existe ou foi removida.</p>
          </div>
        </div>
      </main>
    );
  }

  const visibility = storeData?.visibility ?? {};
  const ownerName = storeData.owner?.name ?? "Vendedor";
  const rating = Number(storeData.reputation ?? 0).toFixed(1);
  const bannerSrc = normalizeImageSrc(storeData.bannerUrl);
  const logoSrc = normalizeImageSrc(storeData.logoUrl);

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-50">
      {/* Banner com overlay */}
      <div className="relative h-64 w-full overflow-hidden">
        {bannerSrc ? (
          <Image src={bannerSrc} alt={storeData.name} fill priority className="object-cover" />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-indigo-500 to-blue-500" />
        )}

        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Conteúdo sobre o banner */}
        <div className="absolute inset-0 flex items-end pb-8">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <div className="flex items-end gap-6">
              {/* Logo */}
              {logoSrc && (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-4 border-white shadow-xl">
                  <Image src={logoSrc} alt={storeData.name} fill className="object-cover" />
                </div>
              )}

              {/* Texto sobre logo */}
              <div className="text-white">
                <h1 className="text-3xl font-bold">{storeData.name}</h1>

                {/* Rating e visitas */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (storeData.reputation || 0) ? "fill-amber-300 text-amber-300" : "text-white/40"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {rating} de 5
                    {visibility?.showVisitCount && (
                      <> • {(storeData.visitsCount || 0).toLocaleString("pt-BR")} visitas</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações e produtos */}
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        {/* Faixa editorial de informações */}
        <div className="mb-8 border-y border-slate-200/70 py-4">
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {visibility?.showOwnerName && (
              <dl className="space-y-1">
                <dt className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Vendedor</dt>
                <dd className="text-sm text-slate-900">{ownerName}</dd>
              </dl>
            )}

            {storeData.description && visibility?.showDescription && (
              <dl className="space-y-1 md:col-span-1">
                <dt className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Sobre</dt>
                <dd className="line-clamp-2 text-sm leading-relaxed text-slate-700">{storeData.description}</dd>
              </dl>
            )}

            {visibility?.showLocation && storeData.address && (
              <dl className="space-y-1 md:justify-self-end md:text-right">
                <dt className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Localização</dt>
                <dd className="text-sm text-slate-900">
                  {storeData.address.city}, {storeData.address.state}
                </dd>
                {storeData.address.zipCode && <dd className="text-xs text-slate-500">{storeData.address.zipCode}</dd>}
              </dl>
            )}
          </div>
        </div>

        {/* Seção de produtos */}
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <p className="mb-6 text-sm font-semibold text-slate-900">Produtos da loja</p>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
            <ProductListClient fetcher={loadStoreProducts} />
          </div>
        </div>

        {/* Localização expandida */}
        {visibility?.showLocation && storeData.address && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <MapPin className="h-5 w-5 text-red-500" />
              Endereço completo
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Endereço</p>
                <p className="mt-1 text-sm text-slate-700">
                  {storeData.address.street}, {storeData.address.number}
                </p>
              </div>
              {storeData.address.complement && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Complemento</p>
                  <p className="mt-1 text-sm text-slate-700">{storeData.address.complement}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cidade</p>
                <p className="mt-1 text-sm text-slate-700">
                  {storeData.address.city}, {storeData.address.state}
                </p>
              </div>
              {storeData.address.zipCode && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">CEP</p>
                  <p className="mt-1 text-sm text-slate-700">{storeData.address.zipCode}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
