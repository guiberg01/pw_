"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  AlertCircle,
  BarChart3,
  ExternalLink,
  Eye,
  FileText,
  Grid3x3,
  Loader2,
  MapPin,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { storeService } from "@/services/storeService";
import ProductListClient from "@/components/product/ProductListClient";
import StoreSummarySection from "@/components/seller/store/StoreSummarySection";

const StatCard = ({ icon: Icon, label, value, trend }) => (
  <Card className="border-slate-200 bg-white/90">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          {trend && <p className="mt-1 text-xs text-emerald-600">{trend}</p>}
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function SellerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("merchant");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [store, setStore] = useState(null);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [melhorEnvioStatus, setMelhorEnvioStatus] = useState(null);

  const loadSellerProducts = useCallback(async () => {
    const res = await storeService.getMyStoreProducts({ page: 1, limit: 100 });
    return Array.isArray(res?.items) ? res.items : [];
  }, []);

  const verifyAndLoad = useCallback(async () => {
    try {
      const storeData = await storeService.getMyStore();

      if (!storeData) {
        router.replace("/seller/onboarding");
        return;
      }

      const [stripeRes, meStatus] = await Promise.allSettled([
        storeService.getMyStripeStatus(),
        storeService.getMyMelhorEnvioStatus(),
      ]);

      const stripeData = stripeRes.status === "fulfilled" ? stripeRes.value : null;
      const statusData = meStatus.status === "fulfilled" ? meStatus.value : null;

      if (meStatus.status === "rejected") {
        setStore(storeData);
        setStripeStatus(stripeData);
        setIsLoadingAuth(false);
        return;
      }

      // Verificar se MelhorEnvio está pendente (é o bloqueador do fluxo)
      if (statusData?.needsReconnect || !statusData?.isConfigured) {
        toast.error("Você precisa completar a integração com o MelhorEnvio para habilitar a loja", {
          description: "Vamos redirecionar você para o onboarding",
          duration: 4000,
        });

        setTimeout(() => {
          router.push("/seller/onboarding");
        }, 2000);
        return;
      }

      setStore(storeData);
      setStripeStatus(stripeData);
      setMelhorEnvioStatus(statusData);
      setIsLoadingAuth(false);
    } catch (error) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;

      if (status === 404 || code === "STORE_NOT_FOUND") {
        router.replace("/seller/onboarding");
        return;
      }

      toast.error(error?.response?.data?.message || "Falha ao carregar a loja");
      setIsLoadingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void verifyAndLoad();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [verifyAndLoad]);

  if (isLoadingAuth) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] px-4 py-14">
        <div className="mx-auto flex max-w-6xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/85 py-32 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center gap-3 text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Carregando sua loja...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] px-4 py-14">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600" />
            <h2 className="text-2xl font-bold text-slate-950">Loja não encontrada</h2>
            <p className="max-w-md text-slate-600">Você ainda não criou uma loja. Vamos começar o onboarding?</p>
            <Button asChild className="mt-4 gap-2 rounded-full">
              <Link href="/seller/onboarding">
                <ShoppingCart className="h-4 w-4" />
                Começar agora
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const visibility = {
    showOwnerName: true,
    showVisitCount: true,
    showDescription: true,
    showLocation: true,
    ...(store.visibility ?? {}),
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <StoreSummarySection store={store} onUpdated={setStore} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="merchant">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
            <TabsList className="grid w-max grid-cols-2 gap-4 bg-transparent p-0">
              <TabsTrigger
                value="merchant"
                className="relative rounded-full border-2 border-transparent bg-transparent px-6 py-2 text-sm font-semibold text-slate-600 transition-all data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Visão de lojista
              </TabsTrigger>
              <TabsTrigger
                value="customer"
                className="relative rounded-full border-2 border-transparent bg-transparent px-6 py-2 text-sm font-semibold text-slate-600 transition-all data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Eye className="mr-2 h-4 w-4" />
                Visão do cliente
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB: Merchant View */}
          <TabsContent value="merchant" className="space-y-8">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={ShoppingCart} label="Pedidos este mês" value="0" trend="↑ 0 desde ontem" />
              <StatCard icon={TrendingUp} label="Faturamento" value="R$ 0,00" trend="↑ 0% este mês" />
              <StatCard icon={Package} label="Produtos listados" value="0" />
              <StatCard icon={Eye} label="Visitas" value={store.visitsCount || 0} />
            </div>

            {/* Quick Actions */}
            <Card className="border-slate-200 bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Grid3x3 className="h-5 w-5" />
                  Ações rápidas
                </CardTitle>
                <CardDescription>Gerencie sua loja facilmente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button asChild variant="outline" className="h-auto flex-col gap-2 rounded-xl py-4">
                    <Link href="/seller/products">
                      <Upload className="h-5 w-5" />
                      <span>Adicionar Produto</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto flex-col gap-2 rounded-xl py-4">
                    <Link href="/seller/orders">
                      <ShoppingCart className="h-5 w-5" />
                      <span>Ver Pedidos</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto flex-col gap-2 rounded-xl py-4">
                    <Link href="/seller/reviews">
                      <Star className="h-5 w-5" />
                      <span>Avaliações</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto flex-col gap-2 rounded-xl py-4">
                    <Link href="/seller/settings">
                      <FileText className="h-5 w-5" />
                      <span>Configurações</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Cards */}
            <div className="grid">
              <Card className="border-slate-200 bg-white/90">
                <CardHeader>
                  <CardTitle>
                    <Link href="/seller/onboarding">Integrações</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const stripeNeedsFix =
                      !stripeStatus?.isConfigured ||
                      !stripeStatus?.detailsSubmitted ||
                      !stripeStatus?.chargesEnabled ||
                      !stripeStatus?.payoutsEnabled;

                    return (
                      <Button
                        asChild={!stripeNeedsFix}
                        variant="ghost"
                        className="h-auto w-full justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 disabled:opacity-100"
                      >
                        {stripeNeedsFix ? (
                          <Link href="/seller/onboarding" className="flex w-full items-center justify-between">
                            <div>
                              <p className="text-left text-sm font-medium text-slate-900">Stripe Connect</p>
                              <p className="text-left text-xs text-slate-500">Pagamentos e repasses</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-red-600">Pendente</span>
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                            </div>
                          </Link>
                        ) : (
                          <div className="flex w-full items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900">Stripe Connect</p>
                              <p className="text-xs text-slate-500">Pagamentos e repasses</p>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                        )}
                      </Button>
                    );
                  })()}

                  {/* MelhorEnvio Integration */}
                  {(() => {
                    const meNeedsFix =
                      !melhorEnvioStatus?.isConfigured || !melhorEnvioStatus?.isActive || melhorEnvioStatus?.isExpired;

                    return (
                      <Button
                        asChild={!meNeedsFix}
                        variant="ghost"
                        className="h-auto w-full justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 disabled:opacity-100"
                      >
                        {meNeedsFix ? (
                          <Link href="/seller/onboarding" className="flex w-full items-center justify-between">
                            <div>
                              <p className="text-left text-sm font-medium text-slate-900">MelhorEnvio</p>
                              <p className="text-left text-xs text-slate-500">Frete e etiquetas</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-red-600">Pendente</span>
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                            </div>
                          </Link>
                        ) : (
                          <div className="flex w-full items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900">MelhorEnvio</p>
                              <p className="text-xs text-slate-500">Frete e etiquetas</p>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                        )}
                      </Button>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customer" className="space-y-8">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Pré-visualização da loja</h2>
                  <p className="mt-1 text-sm text-slate-600">Assim é como os clientes veem sua loja no marketplace</p>
                </div>
                <Button asChild variant="outline" className="gap-2 rounded-full">
                  <Link href={`/stores/${store._id}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                    Ver página completa
                  </Link>
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {/* Banner com overlay */}
                <div className="relative h-48 w-full">
                  {store.bannerUrl ? (
                    <Image src={store.bannerUrl} alt="Banner" fill priority unoptimized className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-linear-to-r from-indigo-500 to-blue-500" />
                  )}

                  {/* Overlay escuro */}
                  <div className="absolute inset-0 bg-black/30" />

                  {/* Conteúdo sobre o banner */}
                  <div className="absolute inset-0 flex items-end pb-6 px-6">
                    <div className="flex items-end gap-4 w-full">
                      {/* Logo */}
                      {store.logoUrl && (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-4 border-white shadow-xl">
                          <Image src={store.logoUrl} alt={store.name} fill unoptimized className="object-cover" />
                        </div>
                      )}

                      {/* Texto sobre logo */}
                      <div className="text-white">
                        <h3 className="text-2xl font-bold">{store.name}</h3>

                        {/* Rating e visitas */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (store.reputation || 0) ? "fill-amber-300 text-amber-300" : "text-white/40"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            {store.reputation || 0} de 5
                            {visibility.showVisitCount && <> • {store.visitsCount || 0} visitas</>}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações e produtos */}
                <div className="px-6 py-6">
                  {/* Faixa editorial de informações */}
                  {(visibility.showOwnerName ||
                    (visibility.showDescription && Boolean(store.description)) ||
                    (visibility.showLocation && Boolean(store.address))) && (
                    <div className="mb-6 border-y border-slate-200/70 py-4">
                      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
                        {visibility.showOwnerName && (
                          <dl className="space-y-1">
                            <dt className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                              Vendedor
                            </dt>
                            <dd className="text-sm text-slate-900">{store.owner?.name || "Vendedor"}</dd>
                          </dl>
                        )}

                        {visibility.showDescription && store.description && (
                          <dl className="space-y-1 md:col-span-1">
                            <dt className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                              Sobre
                            </dt>
                            <dd className="line-clamp-2 text-sm leading-relaxed text-slate-700">{store.description}</dd>
                          </dl>
                        )}

                        {visibility.showLocation && store.address && (
                          <dl className="space-y-1 md:justify-self-end md:text-right">
                            <dt className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400 md:justify-end">
                              <MapPin className="h-3 w-3" />
                              Localização
                            </dt>
                            <dd className="text-sm text-slate-900">
                              {store.address.city}, {store.address.state}
                            </dd>
                            {store.address.zipCode && (
                              <dd className="text-xs text-slate-500">{store.address.zipCode}</dd>
                            )}
                          </dl>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Produtos */}
                  <div>
                    <p className="mb-4 text-sm font-semibold text-slate-900">Produtos da loja</p>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                      <ProductListClient fetcher={loadSellerProducts} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
