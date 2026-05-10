"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const replySchema = z.object({
  comment: z.string().trim().min(1, "Digite a resposta da loja").max(2000, "Resposta muito longa"),
});

export default function ReviewReplyDialog({ open, onOpenChange, review, onSubmit, isProcessing }) {
  const form = useForm({
    resolver: zodResolver(replySchema),
    defaultValues: { comment: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset({ comment: review?.sellerReply?.comment || "" });
    }
  }, [open, review, form]);

  const handleSubmit = async (values) => {
    try {
      await onSubmit(values.comment.trim());
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao salvar resposta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{review?.sellerReply?.comment ? "Editar resposta" : "Responder avaliação"}</DialogTitle>
          <DialogDescription>Sua resposta será exibida para o cliente junto da avaliação do produto.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mensagem</label>
            <textarea
              {...form.register("comment")}
              rows={7}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escreva uma resposta profissional e cordial ao cliente"
            />
            {form.formState.errors.comment && (
              <p className="text-xs text-rose-600">{form.formState.errors.comment.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing} className="bg-blue-600 text-white hover:bg-blue-700">
              {isProcessing ? "Salvando..." : review?.sellerReply?.comment ? "Atualizar resposta" : "Responder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
