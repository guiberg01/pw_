"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/imageUtils";

const RatingStars = ({ rating }) => {
  const filled = Math.round(Number(rating || 0));

  return (
    <div className="flex items-center gap-1" aria-label={`Nota ${rating} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${star <= filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
        >
          <path d="M9.999 1.5l2.57 5.205 5.744.835-4.157 4.05.981 5.72-5.138-2.703-5.138 2.703.98-5.72-4.157-4.05 5.744-.835L9.999 1.5z" />
        </svg>
      ))}
    </div>
  );
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
};

export default function ReviewCard({ review, onReply, onDeleteReply }) {
  const isProductReview = Boolean(review?.product);
  const isOrderReview = !isProductReview;
  const hasReply = Boolean(review?.sellerReply?.comment);
  const mediaCount = (review?.images?.length || 0) + (review?.videos?.length || 0);
  const primaryRating = isProductReview ? review?.rating : review?.storeRating;
  const secondaryRating = isOrderReview ? review?.orderRating : null;
  const title = isProductReview
    ? review?.product?.name || "Produto"
    : `Pedido #${String(review?.order || "").slice(-6) || "-"}`;
  const customerLabel = review?.user?.name || "Cliente";
  const productImage = review?.product?.mainImageUrl;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="grid gap-0 lg:grid-cols-[160px_1fr]">
        <div className="relative h-52 bg-slate-50 lg:h-full">
          {productImage ? (
            <Image src={normalizeImageSrc(productImage)} alt={title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 text-sm text-slate-400">
              {isOrderReview ? "Avaliação do pedido" : "Sem imagem"}
            </div>
          )}
        </div>

        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{title}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">{customerLabel}</span>
                {isProductReview ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    Pedido #{String(review?.subOrder || "").slice(-6) || "-"}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    Avaliação da loja
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <RatingStars rating={primaryRating} />
                <span className="text-sm font-semibold text-slate-900">{Number(primaryRating || 0).toFixed(1)}/5</span>
                {secondaryRating != null && (
                  <span className="text-sm text-slate-600">Pedido {Number(secondaryRating || 0).toFixed(1)}/5</span>
                )}
                <span className="text-xs text-slate-500">Criada em {formatDateTime(review?.createdAt)}</span>
              </div>

              <p className="max-w-3xl text-sm leading-6 text-slate-700">
                {review?.comment?.trim() ? review.comment : "Sem comentário do cliente."}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{mediaCount} mídia(s)</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Atualizada em {formatDateTime(review?.updatedAt)}
                </span>
                {isOrderReview && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    Pedido #{String(review?.order || "").slice(-6) || "-"}
                  </span>
                )}
              </div>
            </div>

            {isProductReview && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onReply(review)} className="rounded-full">
                  {hasReply ? "Editar resposta" : "Responder"}
                </Button>
                {hasReply && (
                  <Button
                    variant="ghost"
                    onClick={() => onDeleteReply(review)}
                    className="rounded-full text-rose-600 hover:bg-rose-50"
                  >
                    Remover resposta
                  </Button>
                )}
              </div>
            )}
          </div>

          {isProductReview && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Resposta da loja</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${hasReply ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {hasReply ? "Respondido" : "Pendente"}
                </span>
              </div>

              {hasReply ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm leading-6 text-slate-700">{review.sellerReply.comment}</p>
                  <p className="text-xs text-slate-500">
                    Respondido em {formatDateTime(review.sellerReply.repliedAt)}
                    {review.sellerReply.editedAt ? ` • editado em ${formatDateTime(review.sellerReply.editedAt)}` : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Ainda não existe resposta para esta avaliação.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
