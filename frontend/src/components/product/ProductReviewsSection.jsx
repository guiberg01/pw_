"use client";

import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { reviewService } from "@/services/reviewService";
import { formatDateTime } from "@/lib/formatters";

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"
          }`}
        />
      ))}
    </div>
  );
};

export function ProductReviewsSection({ productId }) {
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const data = await reviewService.getProductReviews(productId, { page: 1, limit: 10 });
        setReviews(data);
      } catch (error) {
        console.error("Erro ao carregar reviews:", error);
        setReviews({ items: [], summary: { average: 0, total: 0, breakdown: {} } });
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const summary = reviews?.summary ?? {};
  const items = reviews?.items ?? [];
  const average = Number(summary.average ?? 0);
  const total = Number(summary.total ?? 0);

  return (
    <div className="space-y-6 pt-4 border-t border-slate-200 grid gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Avaliações dos clientes</h3>
      </div>

      {total > 0 ? (
        <div className="space-y-6">
          {/* Resumo de avaliações */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-900">{average.toFixed(1)}</span>
                  <span className="text-sm text-slate-600">de 5</span>
                </div>
                <div className="flex items-center gap-1">
                  <StarRating rating={average} />
                </div>
                <p className="text-sm text-slate-600">{total} avaliação(ões)</p>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 flex-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.breakdown?.[star] ?? 0;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 w-12">{star}★</span>
                      <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-sm text-slate-600 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reviews */}
          {items.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Recentes</h4>
              {items.map((review) => (
                <div key={review._id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{review.user?.name ?? "Cliente anônimo"}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-slate-500">{review.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(review.createdAt)}</p>
                  </div>

                  {review.comment && <p className="text-sm text-slate-700 mt-2 leading-relaxed">{review.comment}</p>}

                  {Array.isArray(review.images) && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {review.images.slice(0, 3).map((imageUrl, index) => (
                        <div
                          key={index}
                          className="h-12 w-12 rounded border border-slate-200 overflow-hidden bg-slate-50"
                        >
                          <img
                            src={imageUrl}
                            alt={`Review ${index + 1}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                      {review.images.length > 3 && (
                        <div className="h-12 w-12 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                          +{review.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {review.sellerReply?.comment && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Resposta da loja</p>
                      <p className="text-sm text-slate-700">{review.sellerReply.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-600">Nenhuma avaliação ainda. Seja o primeiro a avaliar este produto!</p>
        </div>
      )}
    </div>
  );
}
