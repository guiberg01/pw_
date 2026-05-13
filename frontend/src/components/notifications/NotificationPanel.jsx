"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCheck, Trash2, Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { notificationService } from "@/services/notificationService";
import { formatDateTime } from "@/lib/formatters";
import { CartPanel } from "@/components/cart/CartPanel";

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

export function NotificationPanel({ isOpen, onClose, onUnreadCountUpdate }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnlyMode, setUnreadOnlyMode] = useState(false);
  const [cartPanelOpen, setCartPanelOpen] = useState(false);

  const lastFilterRef = useRef(null);
  const performLoadNotifications = useCallback(
    async (currentPage = 1, modeValue = false) => {
      try {
        setLoading(true);
        const response = await notificationService.getMyNotifications({
          page: currentPage,
          isRead: modeValue ? "false" : undefined,
        });

        setNotifications(response.items ?? []);
        setTotalPages(response.meta?.totalPages ?? 1);
        if (onUnreadCountUpdate) {
          onUnreadCountUpdate(response.meta?.unreadCount ?? 0);
        }
      } catch (error) {
        toast.error("Erro ao carregar notificações");
      } finally {
        setLoading(false);
      }
    },
    [onUnreadCountUpdate],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (lastFilterRef.current !== unreadOnlyMode) {
      lastFilterRef.current = unreadOnlyMode;
      performLoadNotifications(1, unreadOnlyMode);
    }
  }, [isOpen, unreadOnlyMode, performLoadNotifications]);

  const handleNotificationClick = async (notification) => {
    try {
      if (notification.type === "cart_reminder") {
        setCartPanelOpen(true);
        await notificationService.clickNotification(notification._id);
        performLoadNotifications(page, unreadOnlyMode);
        return;
      }

      const result = await notificationService.clickNotification(notification._id);
      const targetUrl = normalizeActionUrl(result?.actionUrl || notification.actionUrl);

      if (targetUrl) {
        router.push(targetUrl);
        return;
      }

      performLoadNotifications(page, unreadOnlyMode);
    } catch (error) {
      toast.error("Erro ao processar notificação");
    }
  };

  const handleRemoveNotification = async (notificationId) => {
    try {
      await notificationService.removeNotification(notificationId);
      setNotifications(notifications.filter((n) => n._id !== notificationId));
      toast.success("Notificação removida");
    } catch (error) {
      toast.error("Erro ao remover notificação");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      if (onUnreadCountUpdate) {
        onUnreadCountUpdate(0);
      }
      toast.success("Todas as notificações marcadas como lidas");
    } catch (error) {
      toast.error("Erro ao marcar como lidas");
    }
  };

  return (
    <>
      <div
        className={`fixed z-1000 inset-0 overflow-hidden transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={`pointer-events-auto w-screen max-w-md transform transition-transform duration-300 ease-in-out ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Notificações</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {unreadOnlyMode ? "Não lidas" : "Todas as notificações"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md text-slate-500 transition hover:text-slate-700"
                  aria-label="Fechar notificações"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-slate-200 px-6 py-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => setUnreadOnlyMode(!unreadOnlyMode)}
                  className={`text-xs px-3 py-1 rounded-full transition ${
                    unreadOnlyMode ? "bg-orange-200 text-orange-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {unreadOnlyMode ? "Não lidas" : "Ver não lidas"}
                </button>
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" /> Marcar tudo como lido
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-slate-500">Carregando notificações...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <Bell className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="font-medium text-slate-500">Sem notificações</p>
                    <p className="text-center text-sm text-slate-500">
                      {unreadOnlyMode ? "Todas as notificações foram lidas" : "Volte mais tarde"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 rounded-lg border cursor-pointer transition hover:shadow-md ${
                          notification.isRead
                            ? "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            : "bg-orange-50 border-orange-200 hover:bg-orange-100"
                        }`}
                      >
                        <div className="flex items-start gap-3 justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  notification.type === "cart_reminder"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {getNotificationTypeLabel(notification.type)}
                              </span>
                              {!notification.isRead && <span className="h-2 w-2 rounded-full bg-orange-600"></span>}
                            </div>
                            <h3 className="font-semibold text-slate-900 text-sm">{notification.title}</h3>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
                            <p className="text-[10px] text-slate-500 mt-2">{formatDateTime(notification.createdAt)}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNotification(notification._id);
                            }}
                            className="rounded-md p-1 text-slate-400 hover:text-red-600 transition shrink-0"
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="border-t border-slate-200 px-6 py-3 flex gap-2 justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-slate-600 flex items-center">
                    {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CartPanel isOpen={cartPanelOpen} onClose={() => setCartPanelOpen(false)} />
    </>
  );
}
