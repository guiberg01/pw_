"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, CheckCheck, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmActionDialog from "@/components/ui/confirm-action-dialog";
import { notificationService } from "@/services/notificationService";
import {
  AccountEmptyState,
  AccountPageHero,
  AccountPagination,
  AccountSectionCard,
  AccountStatGrid,
  getToneClass,
} from "./AccountPrimitives";
import { formatDateTime } from "@/lib/formatters";

const NOTIFICATION_FILTERS = [
  { value: "", label: "Todas" },
  { value: "unread", label: "Não lidas" },
  { value: "read", label: "Lidas" },
];

const getNotificationTypeLabel = (type) => {
  const labels = {
    order_status: "Pedido",
    product_sold: "Venda",
    review_received: "Review",
    review_request: "Avaliação",
    seller_reply: "Resposta",
    order_cancelled: "Cancelamento",
    refund: "Reembolso",
    store_visits: "Loja",
    coupon_new: "Cupom",
    coupon_expiring: "Cupom",
    product_discount: "Oferta",
    promotion: "Promoção",
    cart_reminder: "Carrinho",
    chat_message: "Chat",
    support_ticket: "Suporte",
    support_message: "Suporte",
    support_status: "Suporte",
    admin_announcement: "Aviso",
  };

  return labels[String(type ?? "")] ?? String(type ?? "Notificação");
};

const normalizeActionUrl = (url) => {
  if (typeof url !== "string") return null;
  if (/^\/orders\/\[.*\]$/.test(url) || /^\/pedidos\/\[.*\]$/.test(url)) {
    return "/pedidos";
  }
  return url.replace(/^\/orders\//, "/pedidos/");
};

export default function NotificationsDashboard() {
  const router = useRouter();
  const [data, setData] = useState({
    items: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 1, unreadCount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [clearingNotification, setClearingNotification] = useState(null);

  const loadNotificationsRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await notificationService.getMyNotifications({
          page,
          isRead: filter === "" ? undefined : filter === "read" ? "true" : "false",
        });
        if (!ignore) setData(response);
      } catch (err) {
        if (!ignore) {
          const message = err?.response?.data?.message || "Não foi possível carregar suas notificações.";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadNotificationsRef.current = loadNotifications;
    void loadNotificationsRef.current();

    return () => {
      ignore = true;
    };
  }, [page, filter]);

  const notifications = useMemo(() => data.items ?? [], [data.items]);
  const pagination = useMemo(
    () => data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1, unreadCount: 0 },
    [data.meta],
  );

  const stats = useMemo(
    () => [
      { label: "Total", value: pagination.total ?? 0, helper: "Notificações recebidas" },
      { label: "Não lidas", value: pagination.unreadCount ?? 0, helper: "Atenção pendente" },
      { label: "Lidas na página", value: notifications.filter((item) => item.isRead).length, helper: "Visão atual" },
      { label: "Tipos", value: new Set(notifications.map((item) => item.type)).size, helper: "Categorias de alerta" },
    ],
    [notifications, pagination.total, pagination.unreadCount],
  );

  const openNotification = async (notification) => {
    const result = await notificationService.clickNotification(notification._id);
    const targetUrl = normalizeActionUrl(result?.actionUrl || notification.actionUrl || null);

    if (targetUrl) {
      router.push(targetUrl);
      return;
    }

    await loadNotificationsRef.current?.();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    toast.success("Todas as notificações foram marcadas como lidas");
    await loadNotificationsRef.current?.();
  };

  const handleRemoveNotification = async () => {
    if (!clearingNotification) return;

    await notificationService.removeNotification(clearingNotification._id);
    toast.success("Notificação removida");
    setClearingNotification(null);
    await loadNotificationsRef.current?.();
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <AccountPageHero
          eyebrow="Notificações"
          title="Centro de alertas"
          description="Acompanhe pedidos, reviews, promoções e mensagens importantes da sua conta."
          actions={
            <>
              <Button
                className="text-blue-400 bg-transparent border border-blue-400 absolute top-2 right-2 hover:bg-transparent transition-shadow hover:shadow-[inset_0_-4px_8px_rgba(59,130,246,0.4)] hover:text-blue-300 hover:border-blue-300"
                variant="outline"
                onClick={() => void loadNotificationsRef.current?.()}
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar
              </Button>
            </>
          }
        >
          <div className="flex flex-wrap gap-2">
            {NOTIFICATION_FILTERS.map((item) => (
              <button
                key={item.value || "all"}
                type="button"
                onClick={() => {
                  setFilter(item.value);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  filter === item.value
                    ? "border-white/30 bg-white/15 text-white"
                    : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </AccountPageHero>

        <AccountStatGrid stats={stats} />

        <AccountSectionCard
          title="Lista de notificações"
          description="Use a ação abrir para entrar no fluxo correto do backend."
        >
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : error && notifications.length === 0 ? (
            <AccountEmptyState
              title="Não foi possível carregar suas notificações"
              description={error}
              actionLabel="Recarregar"
              onAction={() => void loadNotificationsRef.current?.()}
              icon={Bell}
            />
          ) : notifications.length === 0 ? (
            <AccountEmptyState
              title="Sem notificações por enquanto"
              description="Quando houver novidades de pedidos, reviews ou promoções, elas aparecerão aqui."
              actionLabel="Ir para o catálogo"
              actionHref="/products"
              icon={Bell}
            />
          ) : (
            <div className="space-y-4">
              <Button variant="secondary" onClick={() => void handleMarkAllRead()}>
                <CheckCheck className="h-4 w-4" />
                Marcar tudo como lido
              </Button>
              {notifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={`border-slate-200 bg-white shadow-sm ${notification.isRead ? "" : "ring-1 ring-blue-200"}`}
                >
                  <CardContent className="space-y-3 p-4 md:p-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span
                            className={`rounded-full px-3 py-1 font-semibold ${getToneClass(notification.isRead ? "neutral" : "info")}`}
                          >
                            {notification.isRead ? "Lida" : "Não lida"}
                          </span>
                          <span className={`rounded-full px-3 py-1 font-semibold ${getToneClass("success")}`}>
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                          <span>{formatDateTime(notification.createdAt)}</span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-slate-950">{notification.title}</h3>
                          <p className="max-w-3xl text-sm leading-6 text-slate-600">{notification.message}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => void openNotification(notification)}>
                          <ExternalLink className="h-4 w-4" />
                          Abrir
                        </Button>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            await notificationService.markAsRead(notification._id);
                            await loadNotificationsRef.current?.();
                          }}
                        >
                          Marcar lida
                        </Button>
                        <Button variant="destructive" onClick={() => setClearingNotification(notification)}>
                          <Trash2 className="h-4 w-4" />
                          Remover
                        </Button>
                      </div>
                    </div>

                    {notification.actionUrl ? (
                      <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                        Destino: <span className="font-medium text-slate-900">{notification.actionUrl}</span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}

              <AccountPagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </AccountSectionCard>
      </div>

      <ConfirmActionDialog
        open={Boolean(clearingNotification)}
        onOpenChange={(open) => {
          if (!open) setClearingNotification(null);
        }}
        title="Remover notificação"
        description={`Deseja remover ${clearingNotification?.title || "esta notificação"} da sua conta?`}
        confirmLabel="Remover"
        onConfirm={handleRemoveNotification}
      />
    </main>
  );
}
