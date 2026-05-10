"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BannerDeleteModal({ open, onOpenChange, banner, isSaving, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir banner</DialogTitle>
          <DialogDescription>
            Essa ação remove o banner da vitrine e também limpa a imagem local associada, quando aplicável.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <strong className="block text-slate-900">{banner?.title}</strong>
          <span className="break-all text-xs text-slate-500">{banner?.linkUrl}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="destructive" className="gap-2" onClick={onConfirm} disabled={isSaving}>
            {isSaving ? "Excluindo..." : "Excluir banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
