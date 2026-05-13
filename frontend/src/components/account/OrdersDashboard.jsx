"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar, Clock3, Eye, Package, RefreshCw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { orderService } from "@/services/orderService";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  AccountEmptyState,
  AccountPageHero,
  AccountPagination,
  AccountSectionCard,
  AccountStatGrid,
  getToneClass,
} from "./AccountPrimitives";

const ORDER_STATUSES = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "paid", label: "Pagos" },
  { value: "failed", label: "Falhos" },
  { value: "cancelled", label: "Cancelados" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigos" },
];

const ORDER_TONE = {
  pending: "warning",
  paid: "success",
  cancelled: "danger",
  failed: "danger",
};

const getOrderTone = (status) => ORDER_TONE[String(status ?? "")] ?? "info";

const getOrderLabel = (status) => {
  const labels = {
    pending: "Pendente",
    paid: "Pago",
    cancelled: "Cancelado",
    failed: "Falhou",
  };

  return labels[String(status ?? "")] ?? String(status ?? "-");
};

export default function OrdersDashboard() {
  const [data, setData] = useState({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await orderService.getMyOrders({ page, status: status || undefined, sort });

        if (!mounted) return;
        setData(response);
      } catch (err) {
        if (!mounted) return;

        const message = err?.response?.data?.message || "Não foi possível carregar seus pedidos.";
        setError(message);
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [page, sort, status]);

  const handleCancelOrder = async (orderId) => {
    setCancellingOrderId(orderId);
    try {
      await orderService.cancelOrder(orderId);
      toast.success("Pedido cancelado com sucesso");
      // Reload orders
      const response = await orderService.getMyOrders({ page, status: status || undefined, sort });
      setData(response);
    } catch (err) {
      const message = err?.response?.data?.message || "Não foi possível cancelar o pedido.";
      toast.error(message);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const orders = useMemo(() => data.items ?? [], [data.items]);
  const pagination = useMemo(
    () => data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
    [data.pagination],
  );

  const stats = useMemo(() => {
    const pendingCount = orders.filter((order) => order.status === "pending").length;
    const paidCount = orders.filter((order) => order.status === "paid").length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalPaidByCustomer ?? 0), 0);

    return [
      { label: "Pedidos no período", value: pagination.total ?? 0, helper: "Resultado da filtragem atual" },
      { label: "Pendentes na página", value: pendingCount, helper: "Acompanhe os abertos" },
      { label: "Pagos na página", value: paidCount, helper: "Pagamento confirmado" },
      { label: "Total visível", value: formatCurrency(totalSpent), helper: "Somando os pedidos listados" },
    ];
  }, [orders, pagination.total]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <AccountPageHero
          eyebrow="Pedidos"
          title="Seu histórico de compras"
          description="Consulte pedidos, acompanhe status e volte para um checkout pendente quando necessário."
          actions={
            <Button
              className="text-blue-400 bg-transparent border border-blue-400 absolute -top-2 -right-2 hover:bg-transparent transition-shadow hover:shadow-[inset_0_-4px_8px_rgba(59,130,246,0.4)] hover:text-blue-300 hover:border-blue-300"
              variant="outline"
              onClick={() => setPage(1)}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar visão
            </Button>
          }
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ORDER_STATUSES.map((item) => (
              <button
                key={item.value || "all"}
                type="button"
                onClick={() => {
                  setStatus(item.value);
                  setPage(1);
                }}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  status === item.value ? "border-white/30 bg-white/15" : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Filtro</div>
                <div className="mt-1 text-lg font-bold text-white">{item.label}</div>
              </button>
            ))}
          </div>
        </AccountPageHero>

        <AccountStatGrid stats={stats} />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  sort === option.value ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="text-sm text-slate-500">
            {pagination.total} pedido(s) encontrados · página {pagination.page}
          </div>
        </div>

        <AccountSectionCard
          title="Lista de pedidos"
          description="Cada card reúne os subpedidos, totais e o atalho para retomar pagamentos pendentes."
        >
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-44 rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : error && orders.length === 0 ? (
            <AccountEmptyState
              title="Não encontramos pedidos"
              description={error}
              actionLabel="Recarregar"
              onAction={() => window.location.reload()}
              icon={ShoppingBag}
            />
          ) : orders.length === 0 ? (
            <AccountEmptyState
              title="Você ainda não fez pedidos"
              description="Assim que concluir uma compra, ela aparecerá aqui com status, pagamento e subpedidos."
              actionLabel="Ir às ofertas"
              actionHref="/products"
              icon={ShoppingBag}
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                // Extract order ID safely - avoid "undefined" string
                const rawId = order._id ?? order.id;
                const normalizedOrderId = rawId != null ? String(rawId).trim() : "";
                const invalidIdValues = new Set(["", "undefined", "null"]);
                const orderId = invalidIdValues.has(normalizedOrderId.toLowerCase()) ? null : normalizedOrderId;

                if (!orderId) {
                  console.warn("Order found without valid _id:", order);
                  return null;
                }

                const orderTone = getOrderTone(order.status);
                const primaryPayment = order.paymentCurrent ?? order.payment ?? null;
                const subtotal = Number(order.totalPriceProducts ?? 0);
                const shipping = Number(order.totalShippingPrice ?? 0);
                const discount = Number(order.totalDiscount ?? 0);
                const total = Number(order.totalPaidByCustomer ?? subtotal + shipping - discount);
                const canResumeCheckout = order.status === "pending" && Boolean(orderId);

                return (
                  <Card key={orderId || order._id} className="border-slate-200 bg-white shadow-sm">
                    <CardContent className="space-y-4 p-4 md:p-6">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                              Pedido #{orderId ? orderId.slice(-6) : "-"}
                            </span>
                            <span className={`rounded-full px-3 py-1 font-semibold ${getToneClass(orderTone)}`}>
                              {getOrderLabel(order.status)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-slate-950">{formatCurrency(total)}</div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDateTime(order.createdAt)}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-4 w-4" />
                                Pagamento: {primaryPayment?.status || "não iniciado"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button asChild variant="outline">
                            <Link href={`/pedidos/${orderId}`}>
                              <Eye className="h-4 w-4" />
                              Detalhes
                            </Link>
                          </Button>
                          {canResumeCheckout ? (
                            <Button asChild>
                              <Link href={`/checkout/intent/${orderId}/resume`}>Retomar checkout</Link>
                            </Button>
                          ) : null}
                          {order.status === "pending" ? (
                            <Button
                              variant="outline"
                              onClick={() => handleCancelOrder(orderId)}
                              disabled={cancellingOrderId === orderId}
                            >
                              {cancellingOrderId === orderId ? "Cancelando..." : "Cancelar"}
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Produtos</div>
                          <div className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(subtotal)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Frete</div>
                          <div className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(shipping)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Desconto</div>
                          <div className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(discount)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</div>
                          <div className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(total)}</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-slate-900">Subpedidos</div>
                        <div className="grid gap-3 xl:grid-cols-2">
                          {(order.subOrders ?? []).map((subOrder) => (
                            <div
                              key={subOrder._id || subOrder.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-slate-950">{subOrder.store?.name || "Loja"}</div>
                                  <div className="text-sm text-slate-500">
                                    {Array.isArray(subOrder.items) ? subOrder.items.length : 0} item(ns)
                                  </div>
                                </div>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getToneClass(getOrderTone(subOrder.status))}`}
                                >
                                  {getOrderLabel(subOrder.status)}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                                <div>Subtotal: {formatCurrency(subOrder.subTotal)}</div>
                                <div>Frete: {formatCurrency(subOrder.shippingCost)}</div>
                                <div>Desconto: {formatCurrency(subOrder.discountAmount)}</div>
                                <div>Liquido: {formatCurrency(subOrder.vendorNetAmount)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <AccountPagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </AccountSectionCard>
      </div>
    </main>
  );
}
