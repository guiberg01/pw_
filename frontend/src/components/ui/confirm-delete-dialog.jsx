"use client";

import React from "react";
import Image from "next/image";
import { LoaderCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function ConfirmDeleteDialog({ open, onOpenChange, name, id, imageUrl, onConfirm, isProcessing }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Excluir item</DialogTitle>
        <DialogDescription>
          Tem certeza que deseja excluir <strong className="font-semibold">{name}</strong>? Esta ação não pode ser
          desfeita.
        </DialogDescription>

        <div className="mt-4 flex items-center gap-3">
          {imageUrl ? (
            <div className="relative h-16 w-16 rounded-md overflow-hidden">
              <Image src={imageUrl} alt={name} fill unoptimized className="object-cover" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
              <Package className="h-6 w-6" />
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900">{name}</p>
            <p className="text-xs text-slate-600">ID: {id}</p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
