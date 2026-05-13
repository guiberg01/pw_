"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Package,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Store,
  Star,
  Users,
  Ticket,
  Grid,
} from "lucide-react";
import { toast } from "sonner";

import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusTone = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  suspended: "bg-rose-100 text-rose-800 border-rose-200",
  blocked: "bg-slate-200 text-slate-800 border-slate-300",
};

const metricTone = [
  "from-sky-500 to-cyan-400",
  "from-emerald-500 to-lime-400",
  "from-amber-500 to-orange-400",
  "from-indigo-500 to-violet-400",
  "from-rose-500 to-pink-400",
  "from-slate-700 to-slate-500",
];

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatCard = ({ title, value, helper, icon: Icon, tone }) => (
  <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/60">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</div>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${tone} text-white shadow-lg`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setSummary(null);
        try {
          const data = await adminService.getSummary();
          setSummary(data);
        } catch (error) {
          toast.error(error.response?.data?.message || "Falha ao carregar o painel administrativo");
        } finally {
          setLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleLoadSummary = async () => {
    setLoading(true);
    setSummary(null);
    try {
      const data = await adminService.getSummary();
      setSummary(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Falha ao carregar o painel administrativo");
    } finally {
      setLoading(false);
    }
  };

  const counts = summary?.counts ?? {};
  const userCounts = counts.users ?? {};
  const storeCounts = counts.stores ?? {};
  const productCounts = counts.products ?? {};
  const reviewCounts = counts.reviews ?? {};
  const orderCounts = counts.orders ?? {};
  const recentStores = summary?.recentStores ?? [];
  const recentProducts = summary?.recentProducts ?? [];

  if (!loading && !summary) {
    return (
      <main className="h-full min-h-0 w-full bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center py-20">
          <Card className="w-full max-w-xl border-0 bg-white shadow-2xl shadow-slate-200/60">
            <CardContent className="space-y-4 p-8 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-rose-500" />
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-950">Não foi possível carregar o painel</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Tente novamente. Se o problema persistir, verifique se o backend administrativo está disponível.
                </p>
              </div>
              <Button onClick={handleLoadSummary} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Recarregar painel
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 md:px-8">
      <div className="mx-auto flex pb-4 w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-slate-950 text-white shadow-2xl shadow-slate-300/40">
          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.25),rgba(15,23,42,0.55)_45%,rgba(34,197,94,0.18))]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.5fr_0.5fr] lg:items-end">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100 backdrop-blur-sm">
                  <ShieldAlert className="h-4 w-4" />
                  Painel administrativo
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-black tracking-tight md:text-5xl">Visão geral do marketplace</h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                    Monitore usuários, lojas, produtos e pedidos com uma leitura rápida dos pontos críticos. Os cards
                    abaixo destacam volume, bloqueios e os registros mais recentes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
                    <Link href="/admin/stores">
                      Gerenciar lojas
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                  >
                    <Link href="/admin/coupons">
                      <Ticket className="h-4 w-4" />
                      Cupons
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                  >
                    <Link href="/admin/categories">
                      <Grid className="h-4 w-4" />
                      Categorias
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                    onClick={handleLoadSummary}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Atualizar dados
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Users className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.22em]">Usuários</span>
                  </div>
                  <div className="mt-2 text-2xl font-black">{userCounts.total ?? 0}</div>
                  <p className="mt-1 text-xs text-slate-300">
                    {userCounts.sellers ?? 0} sellers e {userCounts.customers ?? 0} clientes
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Store className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.22em]">Lojas</span>
                  </div>
                  <div className="mt-2 text-2xl font-black">{storeCounts.total ?? 0}</div>
                  <p className="mt-1 text-xs text-slate-300">
                    {storeCounts.blocked ?? 0} bloqueadas e {storeCounts.pending ?? 0} pendentes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Usuários"
            value={userCounts.total ?? 0}
            helper={`${userCounts.active ?? 0} ativos · ${userCounts.blocked ?? 0} bloqueados`}
            icon={Users}
            tone={metricTone[0]}
          />
          <StatCard
            title="Lojas"
            value={storeCounts.total ?? 0}
            helper={`${storeCounts.active ?? 0} ativas · ${storeCounts.pending ?? 0} pendentes`}
            icon={Store}
            tone={metricTone[1]}
          />
          <StatCard
            title="Produtos"
            value={productCounts.total ?? 0}
            helper={`${productCounts.blocked ?? 0} bloqueados · ${productCounts.highlighted ?? 0} destacados`}
            icon={ShoppingBag}
            tone={metricTone[2]}
          />
          <StatCard
            title="Avaliações"
            value={reviewCounts.total ?? 0}
            helper={`${orderCounts.paid ?? 0} pedidos pagos monitorados`}
            icon={Star}
            tone={metricTone[3]}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-0 bg-white/90 shadow-xl shadow-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-lg text-slate-950">Lojas recentes</CardTitle>
                <p className="text-sm text-slate-500">Últimos cadastros e mudanças de status.</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/admin/stores">Abrir gestão</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-sm text-slate-500">Carregando lojas recentes...</div>
              ) : recentStores.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">Nenhuma loja recente encontrada.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentStores.map((store) => (
                    <div
                      key={store._id}
                      className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-slate-950">{store.name}</div>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[store.status] || statusTone.blocked}`}
                          >
                            {store.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">
                          Dono: {store.owner?.name || "Sem dono"} · {store.owner?.email || ""}
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">Criada em {formatDate(store.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 shadow-xl shadow-slate-200/60">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg text-slate-950">Atalhos e alertas</CardTitle>
              <p className="text-sm text-slate-500">Fluxos administrativos mais usados.</p>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <Link
                href="/admin/stores"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                <div>
                  <div className="font-semibold text-slate-950">Revisar lojas</div>
                  <div className="text-sm text-slate-500">Aprovar, suspender ou deletar lojas.</div>
                </div>
                <Eye className="h-4 w-4 text-slate-500" />
              </Link>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2 font-semibold text-amber-900">
                  <Package className="h-4 w-4" />
                  Produtos em atenção
                </div>
                <div className="mt-2 text-sm text-amber-900/80">
                  {productCounts.blocked ?? 0} produto(s) bloqueado(s) e {storeCounts.blocked ?? 0} loja(s)
                  bloqueada(s).
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Pedidos</div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
                  <span>Pendentes</span>
                  <span className="font-semibold text-slate-950">{orderCounts.pending ?? 0}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
                  <span>Pagos</span>
                  <span className="font-semibold text-slate-950">{orderCounts.paid ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-0 bg-white/90 shadow-xl shadow-slate-200/60">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg text-slate-950">Status de bloqueios</CardTitle>
              <p className="text-sm text-slate-500">Leitura rápida dos pontos que exigem análise.</p>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Usuários suspensos
                </div>
                <div className="mt-2 text-2xl font-black text-slate-950">{userCounts.suspended ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Usuários bloqueados
                </div>
                <div className="mt-2 text-2xl font-black text-slate-950">{userCounts.blocked ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Lojas bloqueadas</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{storeCounts.blocked ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Produtos bloqueados
                </div>
                <div className="mt-2 text-2xl font-black text-slate-950">{productCounts.blocked ?? 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 shadow-xl shadow-slate-200/60">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg text-slate-950">Produtos recentes</CardTitle>
              <p className="text-sm text-slate-500">Últimos itens criados no catálogo.</p>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-sm text-slate-500">Carregando produtos recentes...</div>
              ) : recentProducts.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">Nenhum produto recente encontrado.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-slate-950">{product.name}</div>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[product.status] || statusTone.blocked}`}
                          >
                            {product.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">Loja: {product.store?.name || "Sem loja"}</div>
                      </div>
                      <div className="text-sm text-slate-500">Criado em {formatDate(product.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
