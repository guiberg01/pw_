"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, RefreshCcw, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewService } from "@/services/reviewService";
import ReviewCard from "./ReviewCard";
import ReviewReplyDialog from "./ReviewReplyDialog";
import ConfirmActionDialog from "@/components/ui/confirm-action-dialog";
import Link from "next/link";

const defaultSummary = {
  average: 0,
  total: 0,
  replied: 0,
  pending: 0,
  breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

const sortOptions = [
  { value: "newest", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigas" },
  { value: "highest", label: "Maior nota" },
  { value: "lowest", label: "Menor nota" },
];

export default function ReviewDashboard() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [replyReview, setReplyReview] = useState(null);
  const [deleteReplyReview, setDeleteReplyReview] = useState(null);
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [isDeletingReply, setIsDeletingReply] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await reviewService.getMyStoreReviews({
        page,
        limit: 12,
        sort,
        search: debouncedSearch || undefined,
      });
      setItems(response.items || []);
      setSummary(response.summary || defaultSummary);
      setTotalPages(response.meta?.totalPages || 1);
      if (page > (response.meta?.totalPages || 1) && (response.meta?.totalPages || 1) > 0) {
        setPage(1);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao carregar avaliações");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReviews();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, debouncedSearch]);

  const summaryCards = useMemo(
    () => [
      { label: "Nota média", value: summary.average?.toFixed(2) || "0.00" },
      { label: "Avaliações", value: String(summary.total || 0) },
      { label: "Respondidas", value: String(summary.replied || 0) },
      { label: "Pendentes", value: String(summary.pending || 0) },
    ],
    [summary],
  );

  const handleSaveReply = async (comment) => {
    if (!replyReview) return;

    setIsSavingReply(true);
    try {
      await reviewService.replyToReview(replyReview._id, comment);
      toast.success(replyReview?.sellerReply?.comment ? "Resposta atualizada" : "Resposta enviada");
      setReplyReview(null);
      await fetchReviews();
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!deleteReplyReview) return;

    setIsDeletingReply(true);
    try {
      await reviewService.deleteReviewReply(deleteReplyReview._id);
      toast.success("Resposta removida");
      setDeleteReplyReview(null);
      await fetchReviews();
    } finally {
      setIsDeletingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex align-end gap-2">
              <Link href="/seller">
                <ChevronLeft className="h-4 w-4 text-blue-600" />
              </Link>
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-blue-600">Avaliações da loja</p>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Responder avaliações</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
              Veja as avaliações reais dos seus produtos, acompanhe a nota média e responda os clientes diretamente por
              aqui.
            </p>
          </div>

          <Button
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => void fetchReviews()}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_0.7fr_0.8fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="h-11 rounded-full border-slate-300 pl-10"
              placeholder="Buscar por produto, cliente, comentário ou resposta"
            />
          </label>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => {
                setPage(1);
                setSort(e.target.value);
              }}
              className="h-11 w-full rounded-full border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
            {isLoading ? "Carregando..." : `${items.length} avaliação(ões) nesta página`}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Carregando avaliações...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Nenhuma avaliação encontrada com os filtros atuais.
          </div>
        ) : (
          items.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onReply={(item) => setReplyReview(item)}
              onDeleteReply={(item) => setDeleteReplyReview(item)}
            />
          ))
        )}
      </section>

      <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm">
        <span>
          Página {page} de {totalPages || 1}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((current) => Math.min(totalPages || 1, current + 1))}
            disabled={page >= totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>

      <ReviewReplyDialog
        open={Boolean(replyReview)}
        onOpenChange={(open) => {
          if (!open) setReplyReview(null);
        }}
        review={replyReview}
        onSubmit={handleSaveReply}
        isProcessing={isSavingReply}
      />

      <ConfirmActionDialog
        open={Boolean(deleteReplyReview)}
        onOpenChange={(open) => {
          if (!open) setDeleteReplyReview(null);
        }}
        title="Remover resposta da loja"
        description={`Tem certeza que deseja remover a resposta para ${deleteReplyReview?.product?.name || "esta avaliação"}?`}
        confirmLabel="Remover"
        onConfirm={handleDeleteReply}
        isProcessing={isDeletingReply}
      />
    </div>
  );
}
