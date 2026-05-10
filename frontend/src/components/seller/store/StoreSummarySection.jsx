"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Edit2, Eye, BookUser, Binoculars, List, MapPin, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSellerStoreSchema } from "@/validators/sellerOnboarding.validator";
import { storeService } from "@/services/storeService";
import { addressService } from "@/services/addressService";

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
};

const sanitizeCep = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 8);

const InfoLine = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
    <p className="text-sm font-medium text-slate-900">{value || "-"}</p>
  </div>
);

export default function StoreSummarySection({ store, onUpdated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [logoPreview, setLogoPreview] = useState(store?.logoUrl || null);
  const [bannerPreview, setBannerPreview] = useState(store?.bannerUrl || null);

  const address = store?.address || null;
  const owner = store?.owner || null;

  const defaultValues = useMemo(
    () => ({
      name: store?.name || "",
      description: store?.description || "",
      cnpj: store?.cnpj || "",
      logoUrl: store?.logoUrl || "",
      bannerUrl: store?.bannerUrl || "",
      address: {
        zipCode: address?.zipCode || "",
        street: address?.street || "",
        number: address?.number || "",
        complement: address?.complement || "",
        neighborhood: address?.neighborhood || "",
        city: address?.city || "",
        state: address?.state || "",
        receiverName: address?.receiverName || "",
        phoneNumber: address?.phoneNumber || "",
      },
    }),
    [store, address],
  );

  const form = useForm({
    resolver: zodResolver(createSellerStoreSchema),
    defaultValues,
    mode: "onChange",
    shouldFocusError: true,
  });

  const openEditor = () => {
    form.reset(defaultValues);
    setLogoPreview(store?.logoUrl || null);
    setBannerPreview(store?.bannerUrl || null);
    setIsOpen(true);
  };

  const handleLookupCep = async () => {
    const cepValue = form.getValues("address.zipCode");
    const sanitizedCep = sanitizeCep(cepValue);

    if (sanitizedCep.length !== 8) {
      form.setError("address.zipCode", { type: "manual", message: "CEP inválido" });
      return;
    }

    setIsLookingUpCep(true);
    try {
      const cepData = await addressService.lookupCep(sanitizedCep);
      if (!cepData) {
        toast.error("Não foi possível consultar o CEP");
        return;
      }

      form.setValue("address.zipCode", cepData.zipCode || sanitizedCep, { shouldValidate: true });
      form.setValue("address.street", cepData.street || "", { shouldValidate: true });
      form.setValue("address.complement", cepData.complement || "", { shouldValidate: true });
      form.setValue("address.neighborhood", cepData.neighborhood || "", { shouldValidate: true });
      form.setValue("address.city", cepData.city || "", { shouldValidate: true });
      form.setValue("address.state", cepData.state || "", { shouldValidate: true });

      toast.success("CEP encontrado e endereço preenchido");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao consultar CEP");
    } finally {
      setIsLookingUpCep(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadResponse = await storeService.uploadLogo(file);
      form.setValue("logoUrl", uploadResponse?.imageUrl || "", { shouldValidate: true });
      setLogoPreview(uploadResponse?.imageUrl || null);
      toast.success("Logo enviada com sucesso");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao enviar logo");
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadResponse = await storeService.uploadBanner(file);
      form.setValue("bannerUrl", uploadResponse?.imageUrl || "", { shouldValidate: true });
      setBannerPreview(uploadResponse?.imageUrl || null);
      toast.success("Banner enviado com sucesso");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao enviar banner");
    }
  };

  const onSubmit = async (values) => {
    setIsSaving(true);

    try {
      const nextAddressPayload = {
        zipCode: values.address.zipCode.trim(),
        street: values.address.street.trim(),
        number: values.address.number.trim(),
        complement: values.address.complement?.trim() || "",
        neighborhood: values.address.neighborhood.trim(),
        city: values.address.city.trim(),
        state: values.address.state.trim().toUpperCase(),
        receiverName: values.address.receiverName.trim(),
        phoneNumber: values.address.phoneNumber.trim(),
      };

      let addressResult = null;
      if (address?._id || address?.id) {
        addressResult = await addressService.updateMyAddress(address._id || address.id, nextAddressPayload);
      } else {
        addressResult = await addressService.createMyAddress(nextAddressPayload);
      }

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        cnpj: values.cnpj?.trim() || "",
        logoUrl: values.logoUrl?.trim() || "",
        bannerUrl: values.bannerUrl?.trim() || "",
        addressId: addressResult?._id || addressResult?.id,
      };

      const updatedStore = await storeService.updateMyStore(payload);
      onUpdated?.(updatedStore);
      setIsOpen(false);
      toast.success("Informações da loja atualizadas com sucesso");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao atualizar informações da loja");
    } finally {
      setIsSaving(false);
    }
  };

  const addressLabel = address
    ? `${address.street || ""}, ${address.number || ""}${address.complement ? ` - ${address.complement}` : ""}, ${address.neighborhood || ""}, ${address.city || ""} - ${address.state || ""}, ${address.zipCode || ""}`
    : "Sem endereço cadastrado";

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.34em] text-blue-600">
            <StoreIcon className="h-4 w-4" /> Painel da loja
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{store?.name || "Sua loja"}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">{store?.slug || "slug-pendente"}</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{store?.status || "active"}</span>
            {store?.reputation != null && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Reputação {store.reputation}/5</span>
            )}
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {store?.visitsCount || 0} visitas
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2 rounded-full border-slate-200 bg-white">
            <a href={`/stores/${store?._id}`} target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4" /> Ver como cliente
            </a>
          </Button>
          <Button className="gap-2 rounded-full bg-blue-600 text-white hover:bg-blue-700" onClick={openEditor}>
            <Edit2 className="h-4 w-4" /> Editar informações
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-white/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <List className="h-4 w-4" /> Dados da loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoLine label="Nome" value={store?.name} />
            <InfoLine label="CNPJ" value={store?.cnpj || "Não informado"} />
            <InfoLine label="Slug" value={store?.slug} />
            <InfoLine label="Criada em" value={formatDateTime(store?.createdAt)} />
            <InfoLine label="Atualizada em" value={formatDateTime(store?.updatedAt)} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BookUser className="h-4 w-4" /> Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoLine label="Nome" value={owner?.name} />
            <InfoLine label="Email" value={owner?.email} />
            <InfoLine label="Telefone" value={owner?.telephone || "Não informado"} />
            <InfoLine label="CPF" value={owner?.cpf || "Não informado"} />
            <InfoLine label="Status da conta" value={owner?.status || "active"} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin className="h-4 w-4" /> Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoLine label="Endereço completo" value={addressLabel} />
            <InfoLine label="CEP" value={address?.zipCode} />
            <InfoLine label="Responsável pela entrega" value={address?.receiverName} />
            <InfoLine label="Telefone do endereço" value={address?.phoneNumber} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Binoculars className="h-4 w-4" /> Visual e operação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoLine label="Reputação" value={store?.reputation != null ? `${store.reputation}/5` : "0/5"} />
            <InfoLine label="Visitas" value={String(store?.visitsCount || 0)} />
            <InfoLine label="Stripe Connect" value={store?.stripeConnectId ? "Conectado" : "Pendente"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 bg-white/90">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700">Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-700">{store?.description || "Sem descrição cadastrada."}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700">Identidade visual</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Logo</p>
              <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                {store?.logoUrl ? (
                  <Image
                    src={store.logoUrl}
                    alt={store.name || "Logo da loja"}
                    width={120}
                    height={120}
                    unoptimized
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-sm text-slate-400">Sem logo</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Banner</p>
              <div className="flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                {store?.bannerUrl ? (
                  <Image
                    src={store.bannerUrl}
                    alt={store.name || "Banner da loja"}
                    width={400}
                    height={160}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-slate-400">Sem banner</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar informações da loja</DialogTitle>
            <DialogDescription>Atualize os dados exibidos para seus clientes e sua operação seller.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nome da loja *</label>
                <Input {...form.register("name")} placeholder="Nome da loja" />
                {form.formState.errors.name && (
                  <p className="text-xs text-rose-600">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">CNPJ</label>
                <Input {...form.register("cnpj")} placeholder="Opcional" />
                {form.formState.errors.cnpj && (
                  <p className="text-xs text-rose-600">{form.formState.errors.cnpj.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Descrição</label>
              <textarea
                {...form.register("description")}
                rows={4}
                placeholder="Conte sobre sua loja"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              {form.formState.errors.description && (
                <p className="text-xs text-rose-600">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Logo</label>
                <Input {...form.register("logoUrl")} placeholder="URL da logo" />
                <div className="flex gap-2">
                  <label className="cursor-pointer rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700">
                    Carregar arquivo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
                {form.formState.errors.logoUrl && (
                  <p className="text-xs text-rose-600">{form.formState.errors.logoUrl.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Banner</label>
                <Input {...form.register("bannerUrl")} placeholder="URL do banner" />
                <div className="flex gap-2">
                  <label className="cursor-pointer rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700">
                    Carregar arquivo
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                  </label>
                </div>
                {form.formState.errors.bannerUrl && (
                  <p className="text-xs text-rose-600">{form.formState.errors.bannerUrl.message}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MapPin className="h-4 w-4 text-blue-600" /> Endereço da loja
                  </p>
                  <p className="text-xs text-slate-500">Use o CEP para preencher automaticamente.</p>
                </div>
                <Button type="button" variant="outline" onClick={handleLookupCep} disabled={isLookingUpCep}>
                  {isLookingUpCep ? "Buscando..." : "Buscar CEP"}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["address.zipCode", "CEP"],
                  ["address.street", "Rua"],
                  ["address.number", "Número"],
                  ["address.complement", "Complemento"],
                  ["address.neighborhood", "Bairro"],
                  ["address.city", "Cidade"],
                  ["address.state", "UF"],
                  ["address.receiverName", "Nome do responsável"],
                  ["address.phoneNumber", "Telefone"],
                ].map(([name, label]) => (
                  <div key={name} className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{label}</label>
                    <Input {...form.register(name)} />
                    {form.formState.errors?.address?.[name.split(".")[1]] && (
                      <p className="text-xs text-rose-600">
                        {form.formState.errors.address[name.split(".")[1]].message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700">
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
