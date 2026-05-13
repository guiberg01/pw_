"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Package,
  ReceiptText,
  ShieldCheck,
  Star,
  Truck,
  Upload,
  X,
} from "lucide-react";
import {
  AccountEmptyState,
  AccountPageHero,
  AccountSectionCard,
  AccountStatGrid,
  getToneClass,
} from "./AccountPrimitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { normalizeImageSrc } from "@/lib/imageUtils";
import { orderService } from "@/services/orderService";
import { reviewService } from "@/services/reviewService";
import { uploadService } from "@/services/uploadService";
import { orderReviewFormSchema } from "@/validators/review.validator";

const STATUS_LABELS = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Processando",
  shipping: "Em envio",
  delivered: "Entregue",
  cancelled: "Cancelado",
  failed: "Falhou",
  succeeded: "Pago",
  requires_action: "Ação necessária",
  refunded: "Reembolsado",
};

const getStatusLabel = (status) => STATUS_LABELS[String(status ?? "").toLowerCase()] ?? String(status ?? "-");

const RatingSelector = ({ label, value, onChange, error }) => (
  <div className="space-y-2">
    <div className="text-sm font-semibold text-slate-900">{label}</div>
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = Number(value ?? 0) >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-semibold transition ${
              active
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Star className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
            {star}
          </button>
        );
      })}
    </div>
    {error ? <p className="text-sm text-rose-600">{error}</p> : null}
  </div>
);

function OrderReviewForm({ orderId, subOrder, existingReview, onSubmitted }) {
  const [uploadingImages, setUploadingImages] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orderReviewFormSchema),
    defaultValues: {
      orderRating: existingReview?.orderRating ?? 5,
      storeRating: existingReview?.storeRating ?? 5,
      comment: existingReview?.comment ?? "",
      images: existingReview?.images ?? [],
    },
  });
  const watchedImages = useWatch({ control, name: "images" });
  const images = Array.isArray(watchedImages) ? watchedImages : [];

  const [productRatings, setProductRatings] = useState({});

  useEffect(() => {
    reset({
      orderRating: existingReview?.orderRating ?? 5,
      storeRating: existingReview?.storeRating ?? 5,
      comment: existingReview?.comment ?? "",
      images: existingReview?.images ?? [],
    });
    // initialize product ratings for items (default 5) asynchronously to avoid cascading renders
    const next = {};
    (subOrder?.items ?? []).forEach((item) => {
      const key = String(item.productVariantId ?? item.productVariant?._id ?? item._id ?? item.sku);
      next[key] = existingReview?.productRatings?.[key] ?? 5;
    });
    const id = setTimeout(() => setProductRatings(next), 0);
    return () => clearTimeout(id);
  }, [existingReview, reset, subOrder]);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const remainingSlots = Math.max(0, 10 - images.length);
      const uploadedImages = [];

      for (const file of files.slice(0, remainingSlots)) {
        const uploaded = await uploadService.uploadReviewImage(file);
        if (uploaded?.imageUrl) uploadedImages.push(uploaded.imageUrl);
      }

      const nextImages = [...images, ...uploadedImages].slice(0, 10);
      setValue("images", nextImages, { shouldValidate: true, shouldDirty: true });
      toast.success(`${uploadedImages.length} imagem(ns) adicionada(s)`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Não foi possível enviar a imagem");
    } finally {
      setUploadingImages(false);
      event.target.value = "";
    }
  };

  const removeImage = (imageUrl) => {
    const nextImages = images.filter((item) => item !== imageUrl);
    setValue("images", nextImages, { shouldValidate: true, shouldDirty: true });
  };

  const handleProductRatingChange = (productVariantId, value) => {
    setProductRatings((cur) => ({ ...cur, [String(productVariantId)]: value }));
  };

  const onSubmit = async (payload) => {
    const items = subOrder?.items ?? [];
    const imagesToSend = images;

    try {
      if (items.length === 1) {
        const item = items[0];
        const pvId = item.productVariantId ?? item.productVariant?._id ?? null;
        const rating = productRatings[String(pvId)] ?? 5;

        await reviewService.createOrderReview({
          orderId,
          subOrderId: subOrder._id,
          ...payload,
          images: imagesToSend,
          productVariantId: pvId,
          productRating: rating,
        });
      } else {
        // create order review without product-specific fields
        await reviewService.createOrderReview({
          orderId,
          subOrderId: subOrder._id,
          ...payload,
          images: imagesToSend,
        });

        // create product reviews for each item in parallel (non-blocking for order review)
        await Promise.all(
          (items || []).map(async (item) => {
            const pvId = item.productVariantId ?? item.productVariant?._id ?? null;
            const rating = productRatings[String(pvId)];
            if (!pvId || rating === undefined) return null;
            try {
              await reviewService.createProductReview({
                productVariantId: pvId,
                subOrderId: subOrder._id,
                rating,
                comment: payload.comment ?? "",
                images: imagesToSend,
              });
            } catch (err) {
              // log and continue
              console.error("Erro ao criar review do produto:", err);
            }
            return null;
          }),
        );
      }

      toast.success("Sua avaliação foi enviada com sucesso");
      onSubmitted?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Não foi possível enviar a avaliação");
    }
  };

  if (existingReview) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          Avaliação enviada
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">Pedido</div>
            <div className="mt-1 font-semibold">{existingReview.orderRating}/5</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">Loja</div>
            <div className="mt-1 font-semibold">{existingReview.storeRating}/5</div>
          </div>
        </div>
        {existingReview.comment ? <p className="mt-3 leading-6">{existingReview.comment}</p> : null}
        {Array.isArray(existingReview.images) && existingReview.images.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {existingReview.images.map((imageUrl) => (
              <Image
                key={imageUrl}
                src={normalizeImageSrc(imageUrl)}
                alt="Imagem da review"
                width={72}
                height={72}
                className="h-18 w-18 rounded-xl object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Controller
          control={control}
          name="orderRating"
          render={({ field }) => (
            <RatingSelector
              label="Nota do pedido"
              value={field.value}
              onChange={field.onChange}
              error={errors.orderRating?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="storeRating"
          render={({ field }) => (
            <RatingSelector
              label="Nota da loja"
              value={field.value}
              onChange={field.onChange}
              error={errors.storeRating?.message}
            />
          )}
        />
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-900">Descrição</span>
        <textarea
          rows={5}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500"
          placeholder="Conte como foi sua experiência com o pedido e com a loja"
          {...register("comment")}
        />
        {errors.comment ? <p className="text-sm text-rose-600">{errors.comment.message}</p> : null}
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Imagens</div>
          <div className="text-xs text-slate-500">Até 10 imagens</div>
        </div>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600 transition hover:bg-slate-50">
          <Upload className="h-4 w-4" />
          {uploadingImages ? "Enviando imagens..." : "Selecionar imagens"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
        </label>
        {errors.images ? <p className="text-sm text-rose-600">{errors.images.message}</p> : null}

        {images.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {images.map((imageUrl) => (
              <div
                key={imageUrl}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <Image
                  src={normalizeImageSrc(imageUrl)}
                  alt="Imagem enviada"
                  width={112}
                  height={112}
                  className="h-28 w-28 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(imageUrl)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-600 shadow-sm transition hover:text-rose-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {(subOrder?.items ?? []).length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">Avaliações por produto</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(subOrder.items ?? []).map((item, idx) => {
                const pvId = item.productVariantId ?? item.productVariant?._id ?? item._id ?? idx;
                const key = String(pvId);
                return (
                  <div key={key} className="rounded-2xl border bg-white p-3">
                    <div className="text-sm font-medium text-slate-900">{item.name}</div>
                    <div className="mt-2">
                      <RatingSelector
                        label={`Nota do produto`}
                        value={productRatings[key]}
                        onChange={(v) => handleProductRatingChange(pvId, v)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={isSubmitting || uploadingImages}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <ReceiptText className="h-4 w-4" />
              Enviar avaliação
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function OrderDetailsView({ orderId }) {
  const [order, setOrder] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receivingBySubOrderId, setReceivingBySubOrderId] = useState({});

  const fetchData = useCallback(async () => {
    const [orderData, reviewData] = await Promise.all([
      orderService.getMyOrderById(orderId),
      reviewService.getMyOrderReviews(orderId),
    ]);

    return {
      orderData,
      reviewData: Array.isArray(reviewData) ? reviewData : [],
    };
  }, [orderId]);

  const reloadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { orderData, reviewData } = await fetchData();
      setOrder(orderData);
      setReviews(reviewData);
    } catch (err) {
      const message = err?.response?.data?.message || "Não foi possível carregar os detalhes do pedido.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { orderData, reviewData } = await fetchData();
        if (cancelled) return;

        setOrder(orderData);
        setReviews(reviewData);
      } catch (err) {
        if (cancelled) return;

        const message = err?.response?.data?.message || "Não foi possível carregar os detalhes do pedido.";
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const reviewsBySubOrderId = useMemo(
    () => new Map(reviews.map((review) => [String(review.subOrder), review])),
    [reviews],
  );

  const subOrders = useMemo(() => order?.subOrders ?? [], [order]);
  const deliveredCount = useMemo(
    () => subOrders.filter((subOrder) => String(subOrder.status) === "delivered").length,
    [subOrders],
  );

  const handleReceiveOrder = async (subOrderId) => {
    setReceivingBySubOrderId((current) => ({ ...current, [subOrderId]: true }));
    try {
      await orderService.confirmOrderReceived(orderId, { subOrderId });
      toast.success("Pedido marcado como recebido");
      await reloadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Não foi possível confirmar o recebimento");
    } finally {
      setReceivingBySubOrderId((current) => ({ ...current, [subOrderId]: false }));
    }
  };

  const stats = useMemo(
    () => [
      { label: "Subpedidos", value: String(subOrders.length), helper: "Separados por loja" },
      { label: "Entregues", value: String(deliveredCount), helper: "Disponíveis para review" },
      { label: "Pagamento", value: getStatusLabel(order?.paymentCurrent?.status), helper: "Status financeiro" },
      { label: "Total", value: formatCurrency(order?.totalPaidByCustomer ?? 0), helper: "Valor final pago" },
    ],
    [deliveredCount, order, subOrders.length],
  );

  return (
    <div className="space-y-6 m-5">
      <AccountPageHero
        eyebrow="Pedidos"
        title={order ? `Pedido #${String(order._id).slice(-6)}` : "Detalhes do pedido"}
        description="Veja os itens comprados, o frete, os dados de entrega e avalie cada subpedido entregue."
        actions={
          <Button asChild variant="outline" className="gap-2 rounded-full bg-white/10 text-white hover:bg-white/15">
            <Link href="/pedidos">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <AccountStatGrid stats={stats} />

      <AccountSectionCard title="Resumo do pedido" description="Informações principais da compra e do pagamento.">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Carregando detalhes...
          </div>
        ) : error && !order ? (
          <AccountEmptyState
            title="Não foi possível carregar o pedido"
            description={error}
            actionLabel="Tentar novamente"
            onAction={() => void reloadData()}
            icon={ShieldCheck}
          />
        ) : order ? (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{getStatusLabel(order.status)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Pagamento</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">
                    {getStatusLabel(order.paymentCurrent?.status)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Criado em</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{formatDateTime(order.createdAt)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Pagamento final</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">
                    {formatCurrency(order.totalPaidByCustomer ?? 0)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-4 w-4" />
                    Atualizado em {formatDateTime(order.updatedAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {subOrders.length} subpedido(s)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Frete {formatCurrency(order.totalShippingPrice ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Endereço de entrega</div>
              <div className="space-y-1 text-sm text-slate-600">
                <div className="font-medium text-slate-900">{order.shippingAddress?.receiverName}</div>
                <div>
                  {order.shippingAddress?.street}, {order.shippingAddress?.number}
                </div>
                <div>
                  {order.shippingAddress?.neighborhood} · {order.shippingAddress?.city}/{order.shippingAddress?.state}
                </div>
                <div>CEP: {order.shippingAddress?.zipCode}</div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                <div className="font-semibold text-slate-900">Pagamentos</div>
                <div className="mt-1">{order.paymentCurrent?.paymentMethod?.type || "Método manual"}</div>
                <div className="text-xs text-slate-500">
                  {Array.isArray(order.paymentAttempts) ? `${order.paymentAttempts.length} tentativa(s)` : ""}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </AccountSectionCard>

      <AccountSectionCard title="Subpedidos" description="Cada loja tem seu próprio envio e sua própria avaliação.">
        {loading ? null : subOrders.length === 0 ? (
          <AccountEmptyState
            title="Nenhum subpedido encontrado"
            description="Esse pedido ainda não tem subpedidos vinculados."
            icon={Package}
          />
        ) : (
          <div className="space-y-4">
            {subOrders.map((subOrder) => {
              const review = reviewsBySubOrderId.get(String(subOrder._id)) ?? null;
              const shipping = subOrder.shipping ?? {};
              const isShipping = String(subOrder.status) === "shipping";
              const isDelivered = String(subOrder.status) === "delivered" || String(shipping.status) === "delivered";

              return (
                <Card key={subOrder._id} className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="space-y-4 p-4 md:p-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-bold text-slate-950">{subOrder.store?.name || "Loja"}</div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getToneClass(isDelivered ? "success" : isShipping ? "warning" : "info")}`}
                          >
                            {getStatusLabel(subOrder.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {Array.isArray(subOrder.items) ? subOrder.items.length : 0} item(ns) · criado em{" "}
                          {formatDateTime(subOrder.createdAt)}
                        </div>
                      </div>

                      {isShipping ? (
                        <Button
                          onClick={() => void handleReceiveOrder(subOrder._id)}
                          disabled={Boolean(receivingBySubOrderId[subOrder._id])}
                        >
                          {receivingBySubOrderId[subOrder._id] ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Confirmando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Pedido recebido
                            </>
                          )}
                        </Button>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Bruto</div>
                        <div className="mt-1 text-sm font-semibold text-slate-950">
                          {formatCurrency(subOrder.subTotal ?? 0)}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Frete</div>
                        <div className="mt-1 text-sm font-semibold text-slate-950">
                          {formatCurrency(subOrder.shippingCost ?? 0)}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Desconto</div>
                        <div className="mt-1 text-sm font-semibold text-slate-950">
                          {formatCurrency(subOrder.discountAmount ?? 0)}
                        </div>
                      </div>
                    </div>

                    {shipping?.trackingCode || shipping?.labelUrl ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <Truck className="h-4 w-4" />
                            Rastreamento: {shipping.trackingCode || "pendente"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4" />
                            Atualizado em {formatDateTime(shipping.updatedAt ?? shipping.createdAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck className="h-4 w-4" />
                            Transportadora: {shipping.carrier || "-"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ReceiptText className="h-4 w-4" />
                            Previsão: {formatDateTime(shipping.estimatedDeliveryDate)}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-3 xl:grid-cols-2">
                      {(subOrder.items ?? []).map((item, index) => (
                        <div
                          key={`${item.sku}-${index}`}
                          className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                            {item.imageUrl ? (
                              <Image
                                src={normalizeImageSrc(item.imageUrl)}
                                alt={item.name}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-950">{item.name}</div>
                            <div className="text-sm text-slate-500">SKU: {item.sku}</div>
                            <div className="text-sm text-slate-500">
                              Qtd: {item.quantity} · {formatCurrency(item.price ?? 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isDelivered ? (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-slate-900">Avaliação do pedido e da loja</div>
                        <OrderReviewForm
                          orderId={orderId}
                          subOrder={subOrder}
                          existingReview={review}
                          onSubmitted={reloadData}
                        />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </AccountSectionCard>
    </div>
  );
}
