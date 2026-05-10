"use client";

import Image from "next/image";
import { Controller } from "react-hook-form";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BannerFormModal({
  open,
  onOpenChange,
  form,
  formMode,
  isSaving,
  isUploadingImage,
  onImageChange,
  onSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex max-h-150 flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{formMode === "create" ? "Novo banner" : "Editar banner"}</DialogTitle>
          <DialogDescription>
            Envie a imagem, defina o link de destino e organize a ordem de exibição.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 pr-3">
          <form id="banner-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="font-medium text-slate-700">
                      Título
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Frete grátis na semana"
                      disabled={isSaving}
                      aria-invalid={fieldState.invalid}
                      className="border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1a4f9c]"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="linkUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="font-medium text-slate-700">
                      Link de destino
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="https://..."
                      disabled={isSaving}
                      aria-invalid={fieldState.invalid}
                      className="border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1a4f9c]"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="displayOrder"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="font-medium text-slate-700">
                      Ordem de exibição
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      min="0"
                      disabled={isSaving}
                      aria-invalid={fieldState.invalid}
                      className="border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1a4f9c]"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="status" className="font-medium text-slate-700">
                      Status
                    </FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => field.onChange("active")}
                        disabled={isSaving}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          field.value === "active"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        Ativo
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("inactive")}
                        disabled={isSaving}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          field.value === "inactive"
                            ? "border-slate-500 bg-slate-100 text-slate-800"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        Inativo
                      </button>
                    </div>
                  </Field>
                )}
              />
            </div>

            <Controller
              name="imageUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="font-medium text-slate-700">Imagem</FieldLabel>
                  <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <label
                      className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-[#1a4f9c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#153f7c] disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        pointerEvents: isUploadingImage || isSaving ? "none" : "auto",
                        opacity: isUploadingImage || isSaving ? 0.5 : 1,
                      }}
                    >
                      <Upload size={14} />
                      {isUploadingImage ? "Enviando..." : "Selecionar imagem"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onImageChange}
                        disabled={isUploadingImage || isSaving}
                      />
                    </label>

                    <p className="text-xs text-slate-500">
                      A imagem é enviada automaticamente para a rota de uploads e a URL fica pronta para salvar o
                      banner.
                    </p>

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}

                    {field.value ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-600">Prévia do banner:</p>
                        <div className="relative aspect-16/7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <Image
                            src={field.value}
                            alt="Prévia do banner"
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 90vw"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid min-h-32 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
                        Nenhuma imagem selecionada.
                      </div>
                    )}
                  </div>
                </Field>
              )}
            />
          </form>
        </div>

        <DialogFooter className="sticky bottom-0 mx-0 rounded-none border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving || isUploadingImage}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="banner-form"
            className="gap-2 bg-[#1a4f9c] text-white hover:bg-[#153f7c]"
            disabled={isSaving || isUploadingImage}
          >
            {isSaving ? "Salvando..." : formMode === "create" ? "Criar banner" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
