"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Edit3, ImageIcon, PencilLine, RefreshCw, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmActionDialog from "@/components/ui/confirm-action-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reviewService } from "@/services/reviewService";
import {
  AccountEmptyState,
  AccountPageHero,
  AccountPagination,
  AccountSectionCard,
  AccountStatGrid,
  getToneClass,
} from "./AccountPrimitives";
import { formatDateTime } from "@/lib/formatters";
import { normalizeImageSrc } from "@/lib/imageUtils";

const SORT_OPTIONS = [
  { value: "newest", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigas" },
  { value: "highest", label: "Maior nota" },
  { value: "lowest", label: "Menor nota" },
];

const buildRatingOptions = () => [1, 2, 3, 4, 5];

function ReviewEditorDialog({ review, open, onOpenChange, onSave }) {
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens with new review
  if (open && review) {
    if (rating !== (review?.rating ?? 5)) setRating(review?.rating ?? 5);
    if (comment !== (review?.comment ?? "")) setComment(review?.comment ?? "");
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!review?._id) return;

    try {
      setIsSaving(true);
      await onSave(review._id, { rating, comment });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar review</DialogTitle>
          <DialogDescription>Ajuste sua nota e comentário para este produto.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">Nota</div>
            <div className="flex flex-wrap gap-2">
              {buildRatingOptions().map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    rating === value
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Star className="h-4 w-4" />
                  {value}
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-900">Comentário</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500"
              placeholder="Conte sua experiência com o produto"
            />
          </label>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ReviewsDashboard() {
  const [data, setData] = useState({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [editingReview, setEditingReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);

  const loadReviewsRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await reviewService.getMyReviews({ page, sort });
        if (!ignore) setData(response);
      } catch (err) {
        if (!ignore) {
          const message = err?.response?.data?.message || "Não foi possível carregar suas reviews.";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadReviewsRef.current = loadReviews;
    void loadReviewsRef.current();

    return () => {
      ignore = true;
    };
  }, [page, sort]);

  const reviews = useMemo(() => data.items ?? [], [data.items]);
  const pagination = useMemo(() => data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }, [data.meta]);

  const stats = useMemo(() => {
    const average =
      reviews.length > 0 ? reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0) / reviews.length : 0;

    return [
      { label: "Reviews na página", value: reviews.length, helper: `${pagination.total ?? 0} no total` },
      { label: "Média da página", value: average ? average.toFixed(1) : "0.0", helper: "Nota média local" },
      {
        label: "5 estrelas",
        value: reviews.filter((review) => Number(review.rating ?? 0) === 5).length,
        helper: "Melhores avaliações",
      },
      {
        label: "3 estrelas ou menos",
        value: reviews.filter((review) => Number(review.rating ?? 0) <= 3).length,
        helper: "Pontos de atenção",
      },
    ];
  }, [reviews, pagination.total]);

  const handleSaveReview = async (reviewId, payload) => {
    await reviewService.updateMyReview(reviewId, payload);
    toast.success("Review atualizada com sucesso");
    await loadReviewsRef.current?.();
  };

  const handleDeleteReview = async () => {
    if (!deletingReview) return;

    await reviewService.deleteMyReview(deletingReview._id);
    toast.success("Review removida com sucesso");
    setDeletingReview(null);
    await loadReviewsRef.current?.();
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <AccountPageHero
          eyebrow="Avaliações"
          title="Minhas reviews"
          description="Revise suas avaliações, ajuste notas e mantenha seu histórico de feedback organizado."
          actions={
            <Button
              className="text-blue-400 bg-transparent border border-blue-400 absolute -top-2 -right-2 hover:bg-transparent transition-shadow hover:shadow-[inset_0_-4px_8px_rgba(59,130,246,0.4)] hover:text-blue-300 hover:border-blue-300"
              variant="outline"
              onClick={() => void loadReviewsRef.current?.()}
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSort(option.value);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  sort === option.value
                    ? "border-white/30 bg-white/15 text-white"
                    : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </AccountPageHero>

        <AccountStatGrid stats={stats} />

        <AccountSectionCard
          title="Lista de reviews"
          description="Cada item mostra o produto avaliado, a nota e ações rápidas."
        >
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-40 rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : error && reviews.length === 0 ? (
            <AccountEmptyState
              title="Não encontramos reviews"
              description={error}
              actionLabel="Recarregar"
              onAction={() => void loadReviewsRef.current?.()}
              icon={PencilLine}
            />
          ) : reviews.length === 0 ? (
            <AccountEmptyState
              title="Você ainda não avaliou produtos"
              description="Suas reviews aparecerão aqui após a entrega de um pedido elegível."
              actionLabel="Ver pedidos"
              actionHref="/pedidos"
              icon={PencilLine}
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const product = review.product ?? {};
                const ratingTone =
                  Number(review.rating ?? 0) >= 4 ? "success" : Number(review.rating ?? 0) >= 3 ? "warning" : "danger";

                return (
                  <Card key={review._id} className="border-slate-200 bg-white shadow-sm">
                    <CardContent className="space-y-4 p-4 md:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                            {product.mainImageUrl ? (
                              <Image
                                src={normalizeImageSrc(product.mainImageUrl)}
                                alt={product.name || "Produto"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Link href={product._id ? `/products/${product._id}` : "/products"} className="block">
                              <div className="text-lg font-bold text-slate-950 hover:text-blue-700">
                                {product.name || "Produto"}
                              </div>
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className={`rounded-full px-3 py-1 font-semibold ${getToneClass(ratingTone)}`}>
                                {review.rating} estrela(s)
                              </span>
                              <span>{formatDateTime(review.createdAt)}</span>
                            </div>
                            <p className="max-w-3xl text-sm leading-6 text-slate-600">
                              {review.comment || "Sem comentário."}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => setEditingReview(review)}>
                            <Edit3 className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button variant="destructive" onClick={() => setDeletingReview(review)}>
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </div>

                      {(review.images?.length > 0 || review.videos?.length > 0) && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {review.images?.length > 0 && (
                            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                              {review.images.length} imagem(ns) anexada(s)
                            </div>
                          )}
                          {review.videos?.length > 0 && (
                            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                              {review.videos.length} vídeo(s) anexado(s)
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <AccountPagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </AccountSectionCard>
      </div>

      <ReviewEditorDialog
        review={editingReview}
        open={Boolean(editingReview)}
        onOpenChange={(open) => {
          if (!open) setEditingReview(null);
        }}
        onSave={handleSaveReview}
      />

      <ConfirmActionDialog
        open={Boolean(deletingReview)}
        onOpenChange={(open) => {
          if (!open) setDeletingReview(null);
        }}
        title="Excluir review"
        description={`Deseja excluir sua avaliação de ${deletingReview?.product?.name || "este produto"}?`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteReview}
      />
    </main>
  );
}
