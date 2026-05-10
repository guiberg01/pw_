"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  BadgeCheck,
  CircleAlert,
  CircleDashed,
  Clock3,
  RefreshCcw,
  PauseCircle,
  PlayCircle,
  ChevronLeft,
  Store,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmActionDialog from "@/components/ui/confirm-action-dialog";
import { storeService } from "@/services/storeService";

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
};

const StatusPill = ({ label, value, tone = "neutral" }) => {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] opacity-70">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
};

export default function SellerSettingsPage() {
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [melhorEnvioStatus, setMelhorEnvioStatus] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [visibility, setVisibility] = useState({
    showOwnerName: true,
    showVisitCount: true,
    showDescription: true,
    showLocation: true,
  });
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      const [storeData, stripeResult, melhorEnvioResult, productsResult] = await Promise.allSettled([
        storeService.getMyStore(),
        storeService.getMyStripeStatus(),
        storeService.getMyMelhorEnvioStatus(),
        storeService.getMyStoreProducts({ page: 1, limit: 1 }),
      ]);

      if (storeData.status === "fulfilled") {
        setStore(storeData.value);
        // Populate visibility from store data
        if (storeData.value?.visibility) {
          setVisibility({
            showOwnerName: storeData.value.visibility.showOwnerName ?? true,
            showVisitCount: storeData.value.visibility.showVisitCount ?? true,
            showDescription: storeData.value.visibility.showDescription ?? true,
            showLocation: storeData.value.visibility.showLocation ?? true,
          });
        }
      }
      if (stripeResult.status === "fulfilled") setStripeStatus(stripeResult.value);
      if (melhorEnvioResult.status === "fulfilled") setMelhorEnvioStatus(melhorEnvioResult.value);
      if (productsResult.status === "fulfilled") {
        setProductCount(Number(productsResult.value?.pagination?.total ?? productsResult.value?.items?.length ?? 0));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao carregar configurações da loja");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await loadSettings();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadSettings();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadSettings]);

  const currentStatus = store?.status || "active";
  const isSuspended = currentStatus === "suspended";
  const isBlocked = currentStatus === "blocked";
  const isPending = currentStatus === "pending";

  const visibilityTone = isSuspended ? "warning" : isBlocked ? "danger" : isPending ? "info" : "success";
  const visibilityLabel = isSuspended ? "Suspensa" : isBlocked ? "Bloqueada" : isPending ? "Pendente" : "Ativa";

  const canToggleStatus = !isBlocked && !isPending;

  const stripeNeedsAttention =
    !stripeStatus?.isConfigured || !stripeStatus?.detailsSubmitted || !stripeStatus?.payoutsEnabled;
  const melhorEnvioNeedsAttention =
    !melhorEnvioStatus?.isConfigured || !melhorEnvioStatus?.isActive || melhorEnvioStatus?.isExpired;

  const handleToggleStatus = async () => {
    if (!pendingStatus) return;

    setIsTogglingStatus(true);

    try {
      const updated = await storeService.updateMyStoreStatus(pendingStatus);
      setStore(updated);
      toast.success(pendingStatus === "suspended" ? "Loja suspensa com sucesso" : "Loja reativada com sucesso");
      setPendingStatus(null);
      await loadSettings();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível atualizar o status da loja");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleSaveVisibility = async () => {
    setIsSavingVisibility(true);

    try {
      const updated = await storeService.updateMyStore({ visibility });
      setStore(updated);
      toast.success("Visibilidade da loja atualizada com sucesso");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível atualizar a visibilidade da loja");
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const summaryCards = useMemo(
    () => [
      { label: "Produtos", value: String(productCount), tone: "neutral" },
      {
        label: "Stripe",
        value: stripeNeedsAttention ? "Atenção" : "OK",
        tone: stripeNeedsAttention ? "warning" : "success",
      },
      {
        label: "MelhorEnvio",
        value: melhorEnvioNeedsAttention ? "Atenção" : "OK",
        tone: melhorEnvioNeedsAttention ? "warning" : "success",
      },
      { label: "Visibilidade", value: visibilityLabel, tone: visibilityTone },
    ],
    [productCount, stripeNeedsAttention, melhorEnvioNeedsAttention, visibilityLabel, visibilityTone],
  );

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] p-4 md:p-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/85 py-28 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center gap-3 text-slate-700">
            <RefreshCcw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Carregando configurações da loja...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] p-4 md:p-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600" />
            <h1 className="text-2xl font-black text-slate-950">Loja não encontrada</h1>
            <p className="max-w-md text-sm text-slate-600">
              Não encontramos uma loja associada à sua conta. Você pode começar pelo onboarding do seller.
            </p>
            <Button asChild className="mt-2 gap-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
              <Link href="/seller/onboarding">
                <Store className="h-4 w-4" /> Ir para onboarding
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-end gap-2 text-[11px] font-bold uppercase tracking-[0.34em] text-blue-600">
                <Link href="/seller">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                Configurações da loja
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                {store.name || "Sua loja"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
                Controle visibilidade, integrações e status operacional da sua loja.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                variant="outline"
                className="gap-2 rounded-full"
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Atualizar
              </Button>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-2 px-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Reputação: </p>
                <p className=" text-sm font-semibold text-slate-900">
                  {store.reputation != null ? `${store.reputation}/5` : "0/5"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <StatusPill key={card.label} label={card.label} value={card.value} tone={card.tone} />
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-slate-950">
                <Store className="h-5 w-5 text-blue-600" /> Estado atual da loja
              </CardTitle>
              <CardDescription>Visibilidade para clientes e capacidade operacional da conta seller.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <StatusPill label="Status" value={visibilityLabel} tone={visibilityTone} />
                <StatusPill label="Slug" value={store.slug || "-"} tone="neutral" />
                <StatusPill label="Criada em" value={formatDateTime(store.createdAt)} tone="neutral" />
                <StatusPill label="Atualizada em" value={formatDateTime(store.updatedAt)} tone="neutral" />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  {isSuspended ? (
                    <PauseCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                  ) : isBlocked ? (
                    <CircleAlert className="mt-0.5 h-5 w-5 text-rose-600" />
                  ) : (
                    <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isSuspended
                        ? "Loja suspensa"
                        : isBlocked
                          ? "Loja bloqueada"
                          : isPending
                            ? "Loja pendente"
                            : "Loja ativa"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {isSuspended
                        ? "Sua loja não aparece para clientes enquanto estiver suspensa. Você pode reativá-la quando quiser."
                        : isBlocked
                          ? "Essa loja foi bloqueada e não pode ser reativada pelo seller. Procure o suporte/admin."
                          : isPending
                            ? "A loja está aguardando liberação administrativa."
                            : "Sua loja está visível para clientes e pronta para vender."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Stripe</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${stripeNeedsAttention ? "text-amber-600" : "text-emerald-600"}`} />
                    <span className="text-sm font-semibold text-slate-900">
                      {stripeNeedsAttention ? "Precisa de atenção" : "Conectado"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {stripeStatus?.isConfigured ? "Conta já foi iniciada" : "Ainda não configurada"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">MelhorEnvio</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Truck className={`h-4 w-4 ${melhorEnvioNeedsAttention ? "text-amber-600" : "text-emerald-600"}`} />
                    <span className="text-sm font-semibold text-slate-900">
                      {melhorEnvioNeedsAttention ? "Precisa de atenção" : "Conectado"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {melhorEnvioStatus?.isConfigured ? "Integração autorizada" : "Ainda não configurado"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Visibilidade da Loja</CardTitle>
              <CardDescription>Controle o que aparece para os clientes na vitrine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={visibility.showOwnerName}
                    onChange={(e) => setVisibility({ ...visibility, showOwnerName: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Mostrar nome do dono</p>
                    <p className="text-xs text-slate-500">Exibe seu nome na vitrine da loja</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={visibility.showVisitCount}
                    onChange={(e) => setVisibility({ ...visibility, showVisitCount: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Mostrar número de visitas</p>
                    <p className="text-xs text-slate-500">Exibe quantas vezes a loja foi visitada</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={visibility.showDescription}
                    onChange={(e) => setVisibility({ ...visibility, showDescription: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Mostrar descrição</p>
                    <p className="text-xs text-slate-500">Exibe sua descrição na aba Sobre a Loja</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={visibility.showLocation}
                    onChange={(e) => setVisibility({ ...visibility, showLocation: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Mostrar localização</p>
                    <p className="text-xs text-slate-500">Exibe seu endereço na aba Localização</p>
                  </div>
                </label>
              </div>

              <Button
                onClick={() => void handleSaveVisibility()}
                disabled={isSavingVisibility}
                className="w-full gap-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSavingVisibility ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar visibilidade"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-2 lg:grid-cols-4">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Suspensão da loja</CardTitle>
              <CardDescription>
                Suspenda para esconder sua loja dos clientes ou reative quando estiver pronto para vender de novo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5" />
                  <p className="text-sm leading-6">
                    Suspender a loja apenas remove a vitrine pública. Seus dados ficam salvos e você pode reativar
                    depois.
                  </p>
                </div>
              </div>

              {!canToggleStatus ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  O status atual não pode ser alterado pelo seller. Entre em contato com o suporte caso precise revisar
                  a conta.
                </div>
              ) : isSuspended ? (
                <Button
                  onClick={() => setPendingStatus("active")}
                  className="w-full gap-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <PlayCircle className="h-4 w-4" /> Reativar loja
                </Button>
              ) : (
                <Button
                  onClick={() => setPendingStatus("suspended")}
                  variant="destructive"
                  className="w-full gap-2 rounded-full"
                >
                  <PauseCircle className="h-4 w-4" /> Suspender loja
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Observações importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-700">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CircleDashed className="mt-0.5 h-4 w-4 text-slate-500" />
                <p>Quando a loja estiver suspensa, ela deixa de aparecer na vitrine pública.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CircleDashed className="mt-0.5 h-4 w-4 text-slate-500" />
                <p>Você pode reativar sem perder produtos, avaliações ou configurações existentes.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CircleDashed className="mt-0.5 h-4 w-4 text-slate-500" />
                <p>Se Stripe ou MelhorEnvio estiverem pendentes, vale resolver isso antes de voltar a vender.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Acesso rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start gap-2 rounded-full">
                <Link href="/seller/products">
                  <Store className="h-4 w-4" /> Gerenciar produtos
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2 rounded-full">
                <Link href="/seller/orders">
                  <Clock3 className="h-4 w-4" /> Ver pedidos
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2 rounded-full">
                <Link href="/seller/reviews">
                  <BadgeCheck className="h-4 w-4" /> Avaliações
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmActionDialog
        open={Boolean(pendingStatus)}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
        title={pendingStatus === "suspended" ? "Suspender loja" : "Reativar loja"}
        description={
          pendingStatus === "suspended"
            ? "A loja sairá da vitrine pública. Os clientes não verão a loja até você reativá-la."
            : "A loja voltará a ficar visível para os clientes assim que você confirmar."
        }
        confirmLabel={pendingStatus === "suspended" ? "Suspender" : "Reativar"}
        cancelLabel="Cancelar"
        onConfirm={handleToggleStatus}
        isProcessing={isTogglingStatus}
      />
    </main>
  );
}
