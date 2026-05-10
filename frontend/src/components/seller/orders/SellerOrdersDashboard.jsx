"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, LoaderCircle, PackageSearch, RefreshCcw, Truck, Zap, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { storeOrderService } from "@/services/storeOrderService";
import Link from "next/link";

const STATUS_FLOW = {
  paid: "processing",
  processing: "shipping",
  shipping: "delivered",
};

const STATUS_LABELS = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Processando",
  shipping: "Em envio",
  delivered: "Entregue",
  cancelled: "Cancelado",
  failed: "Falhou",
};

const STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipping: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  failed: "bg-rose-100 text-rose-700",
};

const ORDER_STATUS_OPTIONS = ["", "pending", "paid", "cancelled", "failed"];
const SUB_ORDER_STATUS_OPTIONS = ["", "pending", "paid", "processing", "shipping", "delivered", "cancelled", "failed"];

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

const StatusPill = ({ status }) => {
  const key = String(status || "pending").toLowerCase();
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[key] || STATUS_STYLES.pending}`}>
      {STATUS_LABELS[key] || key}
    </span>
  );
};

export default function SellerOrdersDashboard() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [subOrderStatus, setSubOrderStatus] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingStatusByOrderId, setIsUpdatingStatusByOrderId] = useState({});
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);

  const loadOrders = async ({ keepLoadingState = true } = {}) => {
    if (keepLoadingState) setIsLoading(true);

    try {
      const data = await storeOrderService.listMyStoreOrders({
        page: pagination.page,
        limit: pagination.limit,
        orderStatus: orderStatus || undefined,
        subOrderStatus: subOrderStatus || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        sort,
      });

      setItems(data.items || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      setSummary(data.summary || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao carregar pedidos");
    } finally {
      if (keepLoadingState) setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadOrders();
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, orderStatus, subOrderStatus, createdFrom, createdTo, sort]);

  const refreshOrders = async () => {
    setIsRefreshing(true);
    try {
      await loadOrders({ keepLoadingState: false });
    } finally {
      setIsRefreshing(false);
    }
  };

  const openOrderDetails = async (orderId) => {
    setSelectedOrderId(orderId);
    setIsLoadingDetail(true);

    try {
      const data = await storeOrderService.getMyStoreOrderById(orderId);
      setSelectedOrder(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao carregar detalhes do pedido");
      setSelectedOrderId(null);
      setSelectedOrder(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const nextStatusFor = (status) => STATUS_FLOW[String(status || "").toLowerCase()] || null;

  const updateStatus = async (orderId, nextStatus) => {
    if (!nextStatus) return;

    setIsUpdatingStatusByOrderId((current) => ({ ...current, [orderId]: true }));

    try {
      await storeOrderService.updateMyStoreOrderStatus(orderId, nextStatus);
      toast.success(`Status atualizado para ${STATUS_LABELS[nextStatus] || nextStatus}`);
      await loadOrders({ keepLoadingState: false });
      if (selectedOrderId === orderId) {
        const detail = await storeOrderService.getMyStoreOrderById(orderId);
        setSelectedOrder(detail);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao atualizar status");
    } finally {
      setIsUpdatingStatusByOrderId((current) => ({ ...current, [orderId]: false }));
    }
  };

  const generateLabel = async () => {
    const subOrderId = selectedOrder?.subOrder?.id;
    if (!subOrderId) return;

    setIsGeneratingLabel(true);
    try {
      await storeOrderService.generateShippingLabel(subOrderId);
      toast.success("Etiqueta gerada com sucesso");
      const detail = await storeOrderService.getMyStoreOrderById(selectedOrderId);
      setSelectedOrder(detail);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível gerar etiqueta");
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const summaryCards = useMemo(
    () => [
      { label: "Pedidos", value: String(summary?.orderCount ?? 0) },
      { label: "Itens vendidos", value: String(summary?.itemsCount ?? 0) },
      { label: "Receita bruta", value: formatCurrency(summary?.grossRevenue ?? 0) },
      { label: "Receita líquida", value: formatCurrency(summary?.netRevenue ?? 0) },
    ],
    [summary],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-end gap-2  text-blue-600">
              <Link href="/seller">
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <p className="text-[11px] font-bold uppercase tracking-[0.34em]">Operação da loja</p>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Pedidos do seller</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
              Acompanhe pedidos reais, filtre por status e mova o fluxo operacional conforme as regras do backend.
            </p>
          </div>

          <Button
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => void refreshOrders()}
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">{card.label}</p>
              <p className="mt-3 text-2xl font-black text-slate-950">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-slate-200 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Use os filtros do backend para refinar sua lista de pedidos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <select
            value={orderStatus}
            onChange={(event) => {
              setPagination((current) => ({ ...current, page: 1 }));
              setOrderStatus(event.target.value);
            }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status || "all"} value={status}>
                {status ? `Order: ${STATUS_LABELS[status] || status}` : "Order: todos"}
              </option>
            ))}
          </select>

          <select
            value={subOrderStatus}
            onChange={(event) => {
              setPagination((current) => ({ ...current, page: 1 }));
              setSubOrderStatus(event.target.value);
            }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            {SUB_ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status || "all"} value={status}>
                {status ? `SubOrder: ${STATUS_LABELS[status] || status}` : "SubOrder: todos"}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={createdFrom}
            onChange={(event) => {
              setPagination((current) => ({ ...current, page: 1 }));
              setCreatedFrom(event.target.value);
            }}
            className="h-10"
          />

          <Input
            type="date"
            value={createdTo}
            onChange={(event) => {
              setPagination((current) => ({ ...current, page: 1 }));
              setCreatedTo(event.target.value);
            }}
            className="h-10"
          />

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setOrderStatus("");
              setSubOrderStatus("");
              setCreatedFrom("");
              setCreatedTo("");
              setSort("newest");
              setPagination((current) => ({ ...current, page: 1 }));
            }}
          >
            Limpar
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Lista de pedidos</CardTitle>
          <CardDescription>
            {isLoading ? "Carregando..." : `${items.length} pedido(s) nesta página • total ${pagination.total}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              Carregando pedidos...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              Nenhum pedido encontrado com os filtros atuais.
            </div>
          ) : (
            items.map((item) => {
              const nextStatus = nextStatusFor(item?.subOrder?.status);
              const isUpdating = Boolean(isUpdatingStatusByOrderId[item?.id]);

              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-950">Pedido #{String(item.id).slice(-6)}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill status={item?.subOrder?.status} />
                        <StatusPill status={item?.order?.status} />
                        <span className="text-xs text-slate-500">{item?.customer?.name || "Cliente"}</span>
                      </div>
                      <p className="text-xs text-slate-500">Criado em {formatDateTime(item?.order?.createdAt)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-right">
                        <p className="text-[11px] font-semibold uppercase text-slate-500">Líquido</p>
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(item?.subOrder?.vendorNetAmount ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-right">
                        <p className="text-[11px] font-semibold uppercase text-slate-500">Itens</p>
                        <p className="text-sm font-bold text-slate-900">
                          {(item?.subOrder?.items || []).reduce((acc, row) => acc + Number(row.quantity || 0), 0)}
                        </p>
                      </div>
                      <Button variant="outline" className="gap-2" onClick={() => void openOrderDetails(item.id)}>
                        <Eye className="h-4 w-4" /> Detalhes
                      </Button>
                      <Button
                        disabled={!nextStatus || isUpdating}
                        onClick={() => void updateStatus(item.id, nextStatus)}
                        className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {isUpdating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        {nextStatus ? `Mover para ${STATUS_LABELS[nextStatus]}` : "Sem próxima etapa"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPagination((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                disabled={pagination.page <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    page: Math.min(current.totalPages || 1, current.page + 1),
                  }))
                }
                disabled={pagination.page >= pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedOrderId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrderId(null);
            setSelectedOrder(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do pedido</DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? `Pedido #${String(selectedOrder.id).slice(-6)} • ${selectedOrder.customer?.name || "Cliente"}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-600">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Carregando detalhes...
            </div>
          ) : !selectedOrder ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Nenhum detalhe carregado.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">SubOrder status</p>
                  <div className="mt-2">
                    <StatusPill status={selectedOrder.subOrder?.status} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Order status</p>
                  <div className="mt-2">
                    <StatusPill status={selectedOrder.order?.status} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Bruto</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {formatCurrency(selectedOrder.subOrder?.subTotal ?? 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Líquido</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {formatCurrency(selectedOrder.subOrder?.vendorNetAmount ?? 0)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <PackageSearch className="h-4 w-4" /> Itens do pedido
                </div>
                <div className="space-y-2">
                  {(selectedOrder.subOrder?.items || []).map((item, index) => (
                    <div
                      key={`${item.productVariantId || index}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                        <span>SKU: {item.sku}</span>
                        <span>Qtd: {item.quantity}</span>
                        <span>Preço: {formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Truck className="h-4 w-4" /> Envio e etiqueta
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <p>Tracking: {selectedOrder.subOrder?.shipping?.trackingCode || "-"}</p>
                    <p className="mt-1">Status shipping: {selectedOrder.subOrder?.shipping?.status || "-"}</p>
                    <p className="mt-1">
                      Etiqueta: {selectedOrder.subOrder?.shipping?.labelUrl ? "Disponível" : "Não gerada"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => void generateLabel()}
                      disabled={isGeneratingLabel}
                    >
                      {isGeneratingLabel ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                      Gerar etiqueta
                    </Button>
                    {selectedOrder.subOrder?.shipping?.labelUrl && (
                      <Button asChild variant="outline">
                        <a href={selectedOrder.subOrder.shipping.labelUrl} target="_blank" rel="noreferrer">
                          Abrir etiqueta
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOrderId(null);
                setSelectedOrder(null);
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
