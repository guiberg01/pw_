"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, LoaderCircle, PencilLine, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import ConfirmActionDialog from "@/components/ui/confirm-action-dialog";
import { AccountEmptyState, AccountSectionCard, getToneClass } from "./AccountPrimitives";
import { paymentMethodService } from "@/services/paymentMethodService";
import { paymentMethodSchema } from "@/validators/paymentMethod.validator";

function PaymentMethodFormDialog({ open, onOpenChange, method, onSave }) {
  const form = useForm({
    resolver: zodResolver(paymentMethodSchema),
    mode: "onBlur",
    defaultValues: {
      type: method?.type ?? "card",
      cardBrand: method?.cardBrand ?? "",
      last4: method?.last4 ?? "",
      expMonth: method?.expMonth ?? null,
      expYear: method?.expYear ?? null,
      isDefault: Boolean(method?.isDefault),
    },
  });

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (values) => {
    try {
      await onSave({
        type: values.type,
        cardBrand: values.cardBrand?.trim() || null,
        last4: String(values.last4).slice(-4) || null,
        expMonth: values.expMonth ? Number(values.expMonth) : null,
        expYear: values.expYear ? Number(values.expYear) : null,
        isDefault: values.isDefault,
      });
    } catch (error) {
      console.error("Error saving payment method:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{method ? "Editar método de pagamento" : "Novo método de pagamento"}</DialogTitle>
          <DialogDescription>
            {method
              ? "Atualize os dados do cartão registrado."
              : "Para adicionar um novo cartão, use nossa integração segura com Stripe durante o checkout."}
          </DialogDescription>
        </DialogHeader>

        {method ? (
          // Editing mode: show Stripe ID as read-only
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2 bg-slate-50 rounded-lg p-3">
              <label className="text-sm font-medium text-slate-700">ID da forma de pagamento</label>
              <p className="text-sm font-mono text-slate-600 break-all select-all">{method.stripePaymentMethodId}</p>
              <p className="text-xs text-slate-500 mt-2">Este ID é gerenciado automaticamente pelo sistema.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 bg-slate-50 rounded-lg p-3">
                <label className="text-sm font-medium text-slate-700">Tipo</label>
                <p className="text-sm text-slate-600">{method.type}</p>
              </div>

              <Controller
                name="cardBrand"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                      Bandeira
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Visa, Mastercard, etc."
                      disabled={form.formState.isSubmitting}
                      aria-invalid={fieldState.invalid}
                      className="bg-slate-50 border-slate-200"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="last4"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                      Últimos 4 dígitos
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="0000"
                      maxLength={4}
                      disabled={form.formState.isSubmitting}
                      aria-invalid={fieldState.invalid}
                      className="bg-slate-50 border-slate-200"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="expMonth"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                      Validade (mês)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      min="1"
                      max="12"
                      placeholder="MM"
                      disabled={form.formState.isSubmitting}
                      aria-invalid={fieldState.invalid}
                      className="bg-slate-50 border-slate-200"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="expYear"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                      Validade (ano)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      min="2000"
                      placeholder="YYYY"
                      disabled={form.formState.isSubmitting}
                      aria-invalid={fieldState.invalid}
                      className="bg-slate-50 border-slate-200"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="isDefault"
              control={form.control}
              render={({ field }) => (
                <Button
                  type="button"
                  variant={field.value ? "secondary" : "outline"}
                  className="w-full"
                  onClick={() => field.onChange(!field.value)}
                >
                  <Star className="h-4 w-4" />
                  {field.value ? "Este será o método padrão" : "Marcar como método padrão"}
                </Button>
              )}
            />

            <DialogFooter className="px-0 pb-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          // Create mode: show message about Stripe integration
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Adicionar novo cartão</h4>
              <p className="text-sm text-blue-800 mb-3">
                Para adicionar um cartão de crédito com segurança, use nossa integração com Stripe durante o checkout.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 ml-2">
                <li>Vá para a página de checkout</li>
                <li>Selecione `&quot;`;Adicionar novo cartão`&quot;`</li>
                <li>Preencha os dados seguindo as instruções de segurança do Stripe</li>
                <li>Seu cartão será registrado automaticamente</li>
              </ol>
            </div>

            <DialogFooter className="px-0 pb-0 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Entendi
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MethodCard({ method, onEdit, onDelete, onSetDefault, isUpdatingDefault }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-950">{method.cardBrand || method.type || "Método de pagamento"}</h3>
            {method.isDefault ? (
              <span className={`${getToneClass("success")} rounded-full px-2 py-0.5 text-[11px] font-semibold`}>
                Padrão
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">{method.type}</p>
          <p className="text-sm text-slate-600">•••• {method.last4 || "----"}</p>
          <p className="text-sm text-slate-600">
            {method.expMonth && method.expYear
              ? `${String(method.expMonth).padStart(2, "0")}/${method.expYear}`
              : "Sem validade informada"}
          </p>
        </div>
        <CreditCard className="h-5 w-5 text-blue-700" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(method)}>
          <PencilLine className="h-4 w-4" />
          Editar
        </Button>
        {!method.isDefault ? (
          <Button variant="outline" size="sm" onClick={() => onSetDefault(method)} disabled={isUpdatingDefault}>
            <Star className="h-4 w-4" />
            Tornar padrão
          </Button>
        ) : null}
        <Button variant="destructive" size="sm" onClick={() => onDelete(method)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function PaymentMethodManagement() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [deletingMethod, setDeletingMethod] = useState(null);
  const [updatingDefaultId, setUpdatingDefaultId] = useState(null);
  const loadMethodsRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    const loadMethods = async () => {
      try {
        setLoading(true);
        const data = await paymentMethodService.getMyPaymentMethods();

        if (!ignore) {
          setMethods(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error?.response?.data?.message || "Não foi possível carregar seus métodos de pagamento");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadMethodsRef.current = loadMethods;
    void loadMethods();

    return () => {
      ignore = true;
    };
  }, []);

  const openCreateDialog = () => {
    setEditingMethod(null);
    setDialogOpen(true);
  };

  const openEditDialog = (method) => {
    setEditingMethod(method);
    setDialogOpen(true);
  };

  const handleSaveMethod = async (payload) => {
    if (editingMethod?._id) {
      await paymentMethodService.updateMyPaymentMethod(editingMethod._id, payload);
      toast.success("Método de pagamento atualizado com sucesso");
    } else {
      await paymentMethodService.createMyPaymentMethod(payload);
      toast.success("Método de pagamento criado com sucesso");
    }

    setDialogOpen(false);
    setEditingMethod(null);
    await loadMethodsRef.current?.();
  };

  const handleDeleteMethod = async () => {
    if (!deletingMethod) return;

    try {
      await paymentMethodService.deleteMyPaymentMethod(deletingMethod._id);
      toast.success("Método de pagamento removido com sucesso");
      setDeletingMethod(null);
      await loadMethodsRef.current?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível remover o método de pagamento");
    }
  };

  const handleSetDefault = async (method) => {
    try {
      setUpdatingDefaultId(method._id);
      await paymentMethodService.setMyDefaultPaymentMethod(method._id);
      toast.success("Método de pagamento definido como padrão");
      await loadMethodsRef.current?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível definir o método padrão");
    } finally {
      setUpdatingDefaultId(null);
    }
  };

  return (
    <>
      <AccountSectionCard
        title="Formas de pagamento"
        className="max-xl:col-start-1 max-xl:col-end-3"
        description="Cadastre métodos usados com frequência e escolha o padrão para novas compras."
        action={
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        }
      >
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : methods.length ? (
          <div className="grid gap-3">
            {methods.map((method) => (
              <MethodCard
                key={method._id}
                method={method}
                onEdit={openEditDialog}
                onDelete={setDeletingMethod}
                onSetDefault={handleSetDefault}
                isUpdatingDefault={updatingDefaultId === method._id}
              />
            ))}
          </div>
        ) : (
          <AccountEmptyState
            title="Nenhum método de pagamento cadastrado"
            description="Adicione a primeira forma de pagamento para agilizar o checkout."
            actionLabel="Adicionar método"
            onAction={openCreateDialog}
            icon={CreditCard}
          />
        )}
      </AccountSectionCard>

      <PaymentMethodFormDialog
        key={`${editingMethod?._id ?? "new"}-${dialogOpen ? "open" : "closed"}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        method={editingMethod}
        onSave={handleSaveMethod}
      />

      <ConfirmActionDialog
        open={Boolean(deletingMethod)}
        onOpenChange={(open) => {
          if (!open) setDeletingMethod(null);
        }}
        title="Excluir método de pagamento"
        description={`Tem certeza que deseja excluir ${deletingMethod?.cardBrand || deletingMethod?.type || "este método"}?`}
        confirmLabel="Excluir"
        isProcessing={false}
        onConfirm={handleDeleteMethod}
      />
    </>
  );
}
