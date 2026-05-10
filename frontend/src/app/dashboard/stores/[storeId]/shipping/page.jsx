"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  CircleDashed,
  ExternalLink,
  LoaderCircle,
  PackageSearch,
  RefreshCcw,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storeService } from "@/services/storeService";

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const StatusPill = ({ label, value, variant = "neutral" }) => {
  const styles = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className={`rounded-xl border px-3 py-2 ${styles[variant]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] opacity-70">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
};

const SectionCard = ({ icon: Icon, title, description, children, accent = "blue" }) => {
  const accentStyles = {
    blue: "from-blue-50 to-sky-50 border-blue-100",
    emerald: "from-emerald-50 to-teal-50 border-emerald-100",
    amber: "from-amber-50 to-orange-50 border-amber-100",
  };

  return (
    <Card className={`overflow-hidden border bg-linear-to-br ${accentStyles[accent]} shadow-sm`}>
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <CardTitle className="text-xl text-slate-900">{title}</CardTitle>
            <CardDescription className="mt-1 text-slate-600">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default function ShippingDashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const storeId = params?.storeId ? String(params.storeId) : null;
  const authenticated = searchParams?.get("authenticated") === "true";

  const [store, setStore] = useState(null);
  const [melhorEnvioStatus, setMelhorEnvioStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPageData = async () => {
    try {
      const [myStore, status] = await Promise.allSettled([
        storeService.getMyStore(),
        storeService.getMyMelhorEnvioStatus(),
      ]);

      if (myStore.status === "fulfilled") {
        setStore(myStore.value);
      }

      if (status.status === "fulfilled") {
        setMelhorEnvioStatus(status.value);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao carregar a página de shipping");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadPageData();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const storeLabel = store?.name || (storeId ? `Loja ${storeId}` : "Sua loja");
  const isConnected = Boolean(
    melhorEnvioStatus?.isConfigured && melhorEnvioStatus?.isActive && !melhorEnvioStatus?.isExpired,
  );
  const integrationTone = isConnected ? "success" : authenticated ? "warning" : "neutral";
  const integrationHeadline = isConnected ? "MelhorEnvio ativo" : "MelhorEnvio requer atenção";
  const integrationCopy = isConnected
    ? "Frete e etiquetas já estão liberados para a operação da loja."
    : "Revise a autorização para liberar cotação de frete e geração de etiquetas.";

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPageData();
      toast.success("Status atualizado com sucesso");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenOnboarding = () => {
    if (melhorEnvioStatus?.onboardingUrl) {
      window.location.href = melhorEnvioStatus.onboardingUrl;
      return;
    }

    toast.error("Não foi possível localizar a URL de onboarding do MelhorEnvio");
  };

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] px-4 py-14">
        <div className="mx-auto flex max-w-6xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/85 py-24 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center gap-3 text-slate-700">
            <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Carregando painel de shipping...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="gap-2 rounded-full border-slate-200 bg-white/80">
              <Link href="/seller/onboarding">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao onboarding
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.38em] text-blue-600">MelhorEnvio</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                Integração de frete concluída para {storeLabel}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">{integrationCopy}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${isConnected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                >
                  {isConnected ? "Pronto para cotação" : "Requer validação"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600">
                  {store?.name ? "Loja localizada" : "Loja em análise"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 [&>*:first-child]:col-span-full">
              <StatusPill label="Status da integração" value={integrationHeadline} variant={integrationTone} />

              <StatusPill
                label="Loja"
                value={store?.name || "Não encontrada"}
                variant={store ? "success" : "warning"}
              />
              <StatusPill
                label="Token ativo"
                value={isConnected ? "Sim" : "Não"}
                variant={isConnected ? "success" : "danger"}
              />
              <StatusPill
                label="Expira em"
                value={formatDateTime(melhorEnvioStatus?.expiresAt)}
                variant={melhorEnvioStatus?.isExpired ? "danger" : "neutral"}
              />
              <StatusPill
                label="Precisa reconectar"
                value={melhorEnvioStatus?.needsReconnect ? "Sim" : "Não"}
                variant={melhorEnvioStatus?.needsReconnect ? "warning" : "success"}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard
            icon={ShieldCheck}
            title={isConnected ? "Autenticação validada" : "Autorização pendente"}
            description={
              isConnected
                ? "O callback do MelhorEnvio concluiu com sucesso e salvou as credenciais da loja."
                : "A loja ainda precisa revisar ou concluir a autorização do MelhorEnvio."
            }
            accent="emerald"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
                <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-900">Conexão recebida</p>
                  <p className="text-sm text-slate-600">
                    A autorização foi processada e a loja já pode usar os endpoints de cotação e etiqueta.
                  </p>
                </div>
              </div>

              <Button onClick={handleRefresh} disabled={isRefreshing} className="w-full gap-2 rounded-full">
                {isRefreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Atualizar status
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            icon={Truck}
            title="Próximo passo"
            description={
              isConnected
                ? "Depois do vínculo, o seller já pode avançar para cotação, seleção de frete e geração de etiquetas."
                : "Conclua a autorização para liberar cotação de frete, seleção e etiquetas."
            }
            accent="blue"
          >
            <div className="space-y-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-blue-100">
                <div className="flex items-center gap-2 text-slate-900">
                  <CircleDashed className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold">Cotação de frete</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Com o MelhorEnvio ativo, a loja passa a calcular frete e oferecer opções de envio no checkout.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-blue-100">
                <div className="flex items-center gap-2 text-slate-900">
                  <PackageSearch className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold">Etiquetas e rastreio</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  A partir daqui, o seller pode gerar etiqueta e acompanhar o status logístico dos pedidos.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={WalletCards}
            title="Acesso rápido"
            description="Atalhos úteis para continuar o fluxo de operação da loja."
            accent="amber"
          >
            <div className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start gap-2 rounded-full border-amber-200 bg-white"
              >
                <Link href="/seller/onboarding">
                  <ExternalLink className="h-4 w-4" />
                  Voltar ao onboarding
                </Link>
              </Button>
              <Button
                onClick={handleOpenOnboarding}
                className="w-full gap-2 rounded-full bg-slate-950 text-white hover:bg-slate-800"
              >
                <ExternalLink className="h-4 w-4" />
                Reabrir autorização do MelhorEnvio
              </Button>
            </div>
          </SectionCard>
        </div>

        <Card className="border-slate-200/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-slate-950">Resumo da integração</CardTitle>
            <CardDescription className="text-slate-600">
              Esse resumo ajuda a validar se a loja já está pronta para operar com shipping.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatusPill label="Store ID" value={storeId || "-"} variant={storeId ? "neutral" : "warning"} />
              <StatusPill
                label="Configurado"
                value={melhorEnvioStatus?.isConfigured ? "Sim" : "Não"}
                variant={melhorEnvioStatus?.isConfigured ? "success" : "warning"}
              />
              <StatusPill
                label="Ativo"
                value={melhorEnvioStatus?.isActive ? "Sim" : "Não"}
                variant={melhorEnvioStatus?.isActive ? "success" : "danger"}
              />
              <StatusPill
                label="Requer ação"
                value={melhorEnvioStatus?.needsReconnect ? "Sim" : "Não"}
                variant={melhorEnvioStatus?.needsReconnect ? "warning" : "success"}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
