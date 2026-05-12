"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, PencilLine } from "lucide-react";
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

const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Email inválido"));
const nameSchema = z.string().trim().min(1, "Nome é obrigatório");
const telephoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === "" || /^\d{10,11}$/.test(val.replace(/[^\d]/g, "")),
    "Telefone inválido. Deve ter 10 ou 11 dígitos.",
  );

const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  telephone: telephoneSchema.optional(),
});

export function EditProfileDialog({ user, open, onOpenChange, onSave }) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      telephone: user?.telephone ?? "",
    },
  });

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      await onSave({
        name: values.name.trim(),
        email: values.email.trim(),
        telephone: values.telephone?.trim() ?? "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <PencilLine className="h-5 w-5" />
          </div>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>Atualize os dados básicos da sua conta.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                  Nome
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                  className="bg-slate-50 border-slate-200"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                  E-mail
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                  className="bg-slate-50 border-slate-200"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="telephone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                  Telefone
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="(00) 00000-0000"
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                  className="bg-slate-50 border-slate-200"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700">
              CPF
            </label>
            <Input value={user?.cpf ?? "Não informado"} readOnly className="bg-slate-100 border-slate-200" />
          </div>

          <DialogFooter className="p-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
