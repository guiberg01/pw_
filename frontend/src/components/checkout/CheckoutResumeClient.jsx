"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, LoaderCircle, Package, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { checkoutService } from "@/services/checkoutService";
import { paymentMethodService } from "@/services/paymentMethodService";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/button";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const getCardLabel = (method) => {
  const parts = [method?.cardBrand, method?.last4 ? `•••• ${method.last4}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Cartão salvo";
};

export function CheckoutResumeClient({ orderId }) {
  const routeParams = useParams();
  const resolvedOrderId = String(orderId ?? routeParams?.orderId ?? "").trim();

  const [order, setOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!resolvedOrderId || ["undefined", "null"].includes(resolvedOrderId.toLowerCase())) {
        setError("Pedido inválido para retomar checkout");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [orderData, paymentMethodsData] = await Promise.all([
          checkoutService.getCheckoutOrderDetails(resolvedOrderId),
          paymentMethodService.getMyPaymentMethods(),
        ]);

        setOrder(orderData);
        const methods = Array.isArray(paymentMethodsData) ? paymentMethodsData : [];
        setPaymentMethods(methods);
        setSelectedPaymentMethodId(methods.find((method) => method.isDefault)?._id || methods[0]?._id || "");
      } catch (err) {
        setError(err?.response?.data?.message || "Não foi possível carregar este pedido");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [resolvedOrderId]);

  const orderSubtotal = Number(order?.totalPriceProducts ?? 0);
  const orderShipping = Number(order?.totalShippingPrice ?? 0);
  const orderDiscount = Number(order?.totalDiscount ?? 0);
  const orderTotal = Number(order?.totalPaidByCustomer ?? orderSubtotal + orderShipping - orderDiscount);

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => String(method._id) === String(selectedPaymentMethodId)) ?? null,
    [paymentMethods, selectedPaymentMethodId],
  );

  const handleResumePayment = async () => {
    if (!stripePromise) {
      setError("Stripe não configurado no frontend.");
      return;
    }

    if (!selectedPaymentMethodId) {
      setError("Selecione uma forma de pagamento antes de continuar.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await checkoutService.resumeCheckoutIntent(resolvedOrderId);
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Não foi possível carregar o Stripe.");
      }

      const confirmation = await stripe.confirmCardPayment(result.paymentIntent.clientSecret, {
        payment_method: selectedPaymentMethod?.stripePaymentMethodId,
      });

      if (confirmation.error) {
        // When the intent is already in a terminal/success path, attempt reconcile before failing.
        const canTryReconcile =
          confirmation.error?.code === "payment_intent_unexpected_state" ||
          /already|succeeded|processing/i.test(String(confirmation.error?.message ?? ""));

        if (!canTryReconcile) {
          throw new Error(confirmation.error.message || "Não foi possível confirmar o pagamento");
        }
      }

      if (
        confirmation.paymentIntent &&
        confirmation.paymentIntent.status !== "succeeded" &&
        confirmation.paymentIntent.status !== "processing"
      ) {
        throw new Error("Pagamento ainda não foi concluído.");
      }

      const reconcileResult = await checkoutService.reconcileCheckoutOrderPaymentUntilSettled(resolvedOrderId, {
        maxAttempts: 8,
        intervalMs: 1200,
      });

      if (!reconcileResult?.settled) {
        throw new Error("Pagamento processado, mas o pedido ainda está sincronizando. Tente atualizar em instantes.");
      }

      toast.success("Pagamento retomado com sucesso");
      window.location.href = "/pedidos?checkout=success";
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Não foi possível retomar o pagamento");
      toast.error(err?.response?.data?.message || err?.message || "Não foi possível retomar o pagamento");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
          </div>
          <p className="text-slate-600 font-medium">Carregando checkout pendente...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/pedidos" className="hover:text-slate-800">
                Pedidos
              </Link>
              <span>›</span>
              <span className="text-slate-800">Retomar checkout</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Checkout pendente</h1>
            <p className="mt-1 text-sm text-slate-600">
              Revise o pedido e conclua o pagamento com a mesma base do backend.
            </p>
          </div>

          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/pedidos">
              <ArrowLeft className="h-4 w-4" />
              Voltar aos pedidos
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] lg:px-8 lg:py-8">
        <div className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">Pedido</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">#{String(order?._id ?? "").slice(-6)}</h2>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {String(order?.status ?? "pending")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Produtos</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(orderSubtotal)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Frete</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(orderShipping)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Desconto</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(orderDiscount)}</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {Array.isArray(order?.subOrders) ? order.subOrders.length : 0} subpedido(s)
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Criado em {formatDateTime(order?.createdAt)}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(order?.subOrders ?? []).map((subOrder) => (
                <div key={subOrder._id || subOrder.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{subOrder.store?.name || "Loja"}</div>
                      <div className="text-sm text-slate-500">
                        {Array.isArray(subOrder.items) ? subOrder.items.length : 0} item(ns)
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(
                        subOrder.subTotal + Number(subOrder.shippingCost ?? 0) - Number(subOrder.discountAmount ?? 0),
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(subOrder.items ?? []).map((item) => {
                      const productVariant = item.productVariant || {};
                      const product = productVariant.product || {};
                      const imageUrl = productVariant.imageUrl || product.mainImageUrl || "/placeholder-product.png";
                      return (
                        <div
                          key={item._id || `${productVariant._id}-${item.quantity}`}
                          className="flex gap-3 rounded-xl bg-slate-50 p-3"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                            <Image src={imageUrl} alt={product.name || "Produto"} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium text-slate-900">
                              {product.name || "Produto"}
                            </p>
                            <p className="text-xs text-slate-500">Qtd. {item.quantity}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">Pagamento</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Escolha um cartão salvo</h2>
              </div>
              <CreditCard className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {paymentMethods.map((method) => {
                const selected = String(method._id) === String(selectedPaymentMethodId);
                return (
                  <button
                    key={method._id}
                    type="button"
                    onClick={() => setSelectedPaymentMethodId(method._id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                      selected
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-950">{getCardLabel(method)}</div>
                      <div className="text-xs text-slate-500">{method.isDefault ? "Padrão" : "Cartão salvo"}</div>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border ${selected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <section className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-200/60 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Total pendente</p>
                <h2 className="mt-1 text-xl font-semibold">{formatCurrency(orderTotal)}</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p>O backend reconcilia o pagamento e dispara pedidos, repasses e notificações.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p>Você pode confirmar novamente com o mesmo fluxo do Stripe.</p>
              </div>
            </div>

            <Button
              onClick={handleResumePayment}
              disabled={submitting || !selectedPaymentMethodId || !paymentMethods.length}
              className="mt-5 w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Retomar pagamento"}
            </Button>

            {!stripePromise && (
              <p className="mt-3 text-xs text-amber-300">
                Configure <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> para ativar a confirmação de pagamento no
                frontend.
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
