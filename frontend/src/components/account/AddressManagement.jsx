"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MapPin, PencilLine, Plus, Search, Star, Trash2 } from "lucide-react";
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
import { addressService } from "@/services/addressService";
import { addressSchema } from "@/validators/address.validator";

const formatCep = (value = "") => {
  const digits = String(value).replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const normalizePhone = (value = "") => String(value).replace(/\D/g, "").slice(0, 11);

function AddressFormDialog({ open, onOpenChange, address, onSave }) {
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const form = useForm({
    resolver: zodResolver(addressSchema),
    mode: "onBlur",
    defaultValues: {
      label: address?.label ?? "",
      receiverName: address?.receiverName ?? "",
      phoneNumber: address?.phoneNumber ?? "",
      zipCode: address?.zipCode ?? "",
      street: address?.street ?? "",
      number: address?.number ?? "",
      complement: address?.complement ?? "",
      neighborhood: address?.neighborhood ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      isDefault: Boolean(address?.isDefault),
    },
  });

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const handleLookupCep = async () => {
    const cep = String(form.getValues("zipCode")).replace(/\D/g, "");

    if (cep.length !== 8) {
      toast.error("Informe um CEP válido com 8 dígitos.");
      return;
    }

    try {
      setLookingUpCep(true);
      const data = await addressService.lookupCep(cep);

      form.setValue("zipCode", data?.zipCode ?? formatCep(cep), { shouldValidate: true });
      form.setValue("street", data?.street ?? form.getValues("street"));
      form.setValue("complement", data?.complement ?? form.getValues("complement"));
      form.setValue("neighborhood", data?.neighborhood ?? form.getValues("neighborhood"));
      form.setValue("city", data?.city ?? form.getValues("city"));
      form.setValue("state", data?.state ?? form.getValues("state"));

      toast.success("CEP encontrado com sucesso");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível consultar o CEP");
    } finally {
      setLookingUpCep(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await onSave({
        label: values.label?.trim() || undefined,
        receiverName: values.receiverName.trim(),
        phoneNumber: normalizePhone(values.phoneNumber),
        zipCode: formatCep(values.zipCode),
        street: values.street.trim(),
        number: values.number.trim(),
        complement: values.complement?.trim() || null,
        neighborhood: values.neighborhood.trim(),
        city: values.city.trim(),
        state: values.state.trim().toUpperCase(),
        isDefault: values.isDefault,
      });
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{address ? "Editar endereço" : "Novo endereço"}</DialogTitle>
          <DialogDescription>Cadastre ou atualize os dados usados nas entregas.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="label"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                    Rótulo
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Casa, trabalho..."
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-50 border-slate-200"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="receiverName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                    Destinatário
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-50 border-slate-200"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="phoneNumber"
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
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-50 border-slate-200"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="zipCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                    CEP
                  </FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="00000-000"
                      disabled={form.formState.isSubmitting || lookingUpCep}
                      aria-invalid={fieldState.invalid}
                      className="bg-slate-50 border-slate-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLookupCep}
                      disabled={lookingUpCep || form.formState.isSubmitting}
                      className="shrink-0"
                    >
                      {lookingUpCep ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="street"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                    Rua
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-50 border-slate-200"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="number"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                    Número
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-50 border-slate-200"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="complement"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                    Complemento
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-50 border-slate-200"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="neighborhood"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                    Bairro
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-50 border-slate-200"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="city"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                    Cidade
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-50 border-slate-200"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="state"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                    Estado
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    maxLength={2}
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-50 border-slate-200 uppercase"
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
                {field.value ? "Este será o endereço padrão" : "Marcar como endereço padrão"}
              </Button>
            )}
          />

          <DialogFooter className="p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : address ? (
                "Salvar alterações"
              ) : (
                "Criar endereço"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddressCard({ address, onEdit, onDelete, onSetDefault, isUpdatingDefault }) {
  return (
    <div className="rounded-2xl flex-1 basis-62.5 border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-950">{address.label || address.receiverName || "Endereço"}</h3>
            {address.isDefault ? (
              <span className={`${getToneClass("success")} rounded-full px-2 py-0.5 text-[11px] font-semibold`}>
                Padrão
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">
            {address.street}, {address.number}
          </p>
          <p className="text-sm text-slate-600">
            {address.neighborhood} - {address.city}/{address.state}
          </p>
          <p className="text-sm text-slate-600">CEP {address.zipCode}</p>
          <p className="text-sm text-slate-600">{address.phoneNumber}</p>
        </div>
        <MapPin className="h-5 w-5 text-blue-700" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(address)}>
          <PencilLine className="h-4 w-4" />
          Editar
        </Button>
        {!address.isDefault ? (
          <Button variant="outline" size="sm" onClick={() => onSetDefault(address)} disabled={isUpdatingDefault}>
            <Star className="h-4 w-4" />
            Tornar padrão
          </Button>
        ) : null}
        <Button variant="destructive" size="sm" onClick={() => onDelete(address)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function AddressManagement() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(null);
  const [updatingDefaultId, setUpdatingDefaultId] = useState(null);
  const loadAddressesRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    const loadAddresses = async () => {
      try {
        setLoading(true);
        const data = await addressService.getMyAddresses();

        if (!ignore) {
          setAddresses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error?.response?.data?.message || "Não foi possível carregar seus endereços");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadAddressesRef.current = loadAddresses;
    void loadAddresses();

    return () => {
      ignore = true;
    };
  }, []);

  const openCreateDialog = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const openEditDialog = (address) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleSaveAddress = async (payload) => {
    if (editingAddress?._id) {
      await addressService.updateMyAddress(editingAddress._id, payload);
      toast.success("Endereço atualizado com sucesso");
    } else {
      await addressService.createMyAddress(payload);
      toast.success("Endereço criado com sucesso");
    }

    setDialogOpen(false);
    setEditingAddress(null);
    await loadAddressesRef.current?.();
  };

  const handleDeleteAddress = async () => {
    if (!deletingAddress) return;

    try {
      await addressService.deleteMyAddress(deletingAddress._id);
      toast.success("Endereço removido com sucesso");
      setDeletingAddress(null);
      await loadAddressesRef.current?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível remover o endereço");
    }
  };

  const handleSetDefault = async (address) => {
    try {
      setUpdatingDefaultId(address._id);
      await addressService.setMyDefaultAddress(address._id);
      toast.success("Endereço definido como padrão");
      await loadAddressesRef.current?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível definir o endereço padrão");
    } finally {
      setUpdatingDefaultId(null);
    }
  };

  return (
    <>
      <AccountSectionCard
        title="Endereços"
        className="col-start-1 col-end-3"
        description="Adicione, edite e defina o endereço padrão para suas compras."
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
        ) : addresses.length ? (
          <div className="flex flex-wrap gap-3">
            {addresses.map((address) => (
              <AddressCard
                key={address._id}
                address={address}
                onEdit={openEditDialog}
                onDelete={setDeletingAddress}
                onSetDefault={handleSetDefault}
                isUpdatingDefault={updatingDefaultId === address._id}
              />
            ))}
          </div>
        ) : (
          <AccountEmptyState
            title="Nenhum endereço cadastrado"
            description="Crie o primeiro endereço para agilizar suas compras e entregas."
            actionLabel="Adicionar endereço"
            onAction={openCreateDialog}
            icon={MapPin}
          />
        )}
      </AccountSectionCard>

      <AddressFormDialog
        key={`${editingAddress?._id ?? "new"}-${dialogOpen ? "open" : "closed"}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        address={editingAddress}
        onSave={handleSaveAddress}
      />

      <ConfirmActionDialog
        open={Boolean(deletingAddress)}
        onOpenChange={(open) => {
          if (!open) setDeletingAddress(null);
        }}
        title="Excluir endereço"
        description={`Tem certeza que deseja excluir ${deletingAddress?.label || deletingAddress?.receiverName || "este endereço"}?`}
        confirmLabel="Excluir"
        isProcessing={false}
        onConfirm={handleDeleteAddress}
      />
    </>
  );
}
