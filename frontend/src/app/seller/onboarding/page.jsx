"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertCircle,
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  Clock3,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  LogIn,
  MapPin,
  RefreshCcw,
  Search,
  ShieldCheck,
  Store as StoreIcon,
  Truck,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { addressService } from "@/services/addressService";
import { storeService } from "@/services/storeService";
import { createSellerStoreSchema } from "@/validators/sellerOnboarding.validator";
import { normalizeImageSrc } from "@/lib/imageUtils";

const defaultValues = {
  name: "",
  description: "",
  cnpj: "",
  logoUrl: "",
  bannerUrl: "",
  address: {
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    receiverName: "",
    phoneNumber: "",
  },
};

const buildAbsoluteUrl = (path = "/seller/onboarding") => {
  if (typeof window === "undefined") return "http://localhost:3000";
  return `${window.location.origin}${path}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const stripBrazilianDocument = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .trim();

const sanitizeCep = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 8);

const ControlledTextField = ({
  control,
  name,
  label,
  placeholder,
  disabled,
  type = "text",
  autoComplete,
  inputProps = {},
  onBlur,
}) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        <Input
          {...field}
          id={field.name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onBlur={(event) => {
            field.onBlur();
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
    )}
  />
);

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState("loading");
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [isGeneratingStripeLink, setIsGeneratingStripeLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDispatchingPayouts, setIsDispatchingPayouts] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [store, setStore] = useState(null);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [melhorEnvioStatus, setMelhorEnvioStatus] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(true);

  const form = useForm({
    resolver: zodResolver(createSellerStoreSchema),
    defaultValues,
    mode: "onChange",
    revalidateMode: "onChange",
    shouldFocusError: true,
  });

  const hasStore = Boolean(store?._id || store?.id);

  const stripeNeedsAction = useMemo(() => {
    if (!stripeStatus?.isConfigured) return true;
    if (!stripeStatus?.detailsSubmitted) return true;
    if (!stripeStatus?.chargesEnabled) return true;
    if (!stripeStatus?.payoutsEnabled) return true;
    return false;
  }, [stripeStatus]);

  const melhorEnvioNeedsAction = useMemo(() => {
    if (!melhorEnvioStatus?.isConfigured) return true;
    if (!melhorEnvioStatus?.isActive) return true;
    if (melhorEnvioStatus?.isExpired) return true;
    return false;
  }, [melhorEnvioStatus]);

  const onboardingSteps = useMemo(() => {
    const steps = [];

    steps.push({
      key: "store",
      title: "Criar a loja",
      done: hasStore,
      description: "Define o perfil base da operação e libera as integrações seguintes.",
    });

    steps.push({
      key: "stripe",
      title: "Conectar Stripe",
      done: !stripeNeedsAction,
      description: "Habilita pagamentos, repasses e liberação financeira para a conta da loja.",
    });

    steps.push({
      key: "melhorenvio",
      title: "Conectar MelhorEnvio",
      done: !melhorEnvioNeedsAction,
      description: "Libera cotação de frete, geração de etiquetas e fluxo logístico.",
    });

    return steps;
  }, [hasStore, melhorEnvioNeedsAction, stripeNeedsAction]);

  const completedSteps = onboardingSteps.filter((step) => step.done).length;
  const completionPercent = Math.round((completedSteps / onboardingSteps.length) * 100);
  const isOnboardingComplete = completedSteps === onboardingSteps.length;
  const currentStage = !hasStore
    ? "store"
    : melhorEnvioNeedsAction
      ? "melhorenvio"
      : stripeNeedsAction
        ? "stripe"
        : "done";

  const currentStageLabel = {
    store: "1. Criar a loja",
    melhorenvio: "2. Conectar MelhorEnvio",
    stripe: "3. Conectar Stripe",
    done: "Fluxo concluído",
  }[currentStage];

  const currentStageDescription = {
    store: "Comece pela base: a loja precisa existir antes das integrações.",
    melhorenvio: "Agora o foco é liberar frete e etiquetas para o checkout.",
    stripe: "Último passo: finalize pagamentos e repasses.",
    done: "Tudo pronto. O fluxo da loja já está liberado.",
  }[currentStage];

  const loadStatuses = useCallback(async () => {
    if (!hasStore) return;

    const [stripeResult, melhorEnvioResult] = await Promise.allSettled([
      storeService.getMyStripeStatus(),
      storeService.getMyMelhorEnvioStatus(),
    ]);

    if (stripeResult.status === "fulfilled") {
      setStripeStatus(stripeResult.value);
    }

    if (melhorEnvioResult.status === "fulfilled") {
      setMelhorEnvioStatus(melhorEnvioResult.value);
    }
  }, [hasStore]);

  useEffect(() => {
    let isMounted = true;

    storeService
      .getMyStore()
      .then(async (myStore) => {
        if (!isMounted) return;

        setStore(myStore);
        form.reset({
          ...defaultValues,
          name: myStore?.name ?? "",
          description: myStore?.description ?? "",
          cnpj: myStore?.cnpj ?? "",
          logoUrl: myStore?.logoUrl ?? "",
          bannerUrl: myStore?.bannerUrl ?? "",
        });

        setLogoPreview(myStore?.logoUrl ?? null);
        setBannerPreview(myStore?.bannerUrl ?? null);
        setAuthStatus("authenticated");

        await loadStatuses();
      })
      .catch((error) => {
        if (!isMounted) return;

        const status = error?.response?.status;
        const code = error?.response?.data?.code;

        if (status === 401) {
          setAuthStatus("unauthenticated");
          return;
        }

        if (status === 404 || code === "STORE_NOT_FOUND") {
          setStore(null);
          setStripeStatus(null);
          setMelhorEnvioStatus(null);
          setAuthStatus("authenticated");
          return;
        }

        toast.error(error?.response?.data?.message || "Falha ao carregar dados de onboarding");
        setStore(null);
        setStripeStatus(null);
        setMelhorEnvioStatus(null);
        setAuthStatus("authenticated");
      });

    return () => {
      isMounted = false;
    };
  }, [form, loadStatuses]);

  const refreshAllStatuses = async () => {
    if (!hasStore) return;

    setIsRefreshing(true);

    try {
      await loadStatuses();
      toast.success("Status das integrações atualizado");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível atualizar os status");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);

    try {
      const uploadResponse = await storeService.uploadLogo(file);
      form.setValue("logoUrl", uploadResponse?.imageUrl || "");
      setLogoPreview(uploadResponse?.imageUrl || null);
      toast.success("Logo enviada com sucesso");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao enviar logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);

    try {
      const uploadResponse = await storeService.uploadBanner(file);
      form.setValue("bannerUrl", uploadResponse?.imageUrl || "");
      setBannerPreview(uploadResponse?.imageUrl || null);
      toast.success("Banner enviado com sucesso");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao enviar banner");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const clearLogo = () => {
    form.setValue("logoUrl", "");
    setLogoPreview(null);
  };

  const clearBanner = () => {
    form.setValue("bannerUrl", "");
    setBannerPreview(null);
  };

  const handleLookupCep = async () => {
    const cepValue = form.getValues("address.zipCode");
    const sanitizedCep = sanitizeCep(cepValue);

    if (sanitizedCep.length !== 8) {
      form.setError("address.zipCode", {
        type: "manual",
        message: "CEP inválido",
      });
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

  const onCreateStore = async (values) => {
    setIsCreatingStore(true);

    try {
      const addressPayload = {
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

      const createdAddress = await addressService.createMyAddress(addressPayload);
      const addressId = createdAddress?._id || createdAddress?.id;

      if (!addressId) {
        throw new Error("Não foi possível criar o endereço da loja");
      }

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        cnpj: values.cnpj?.trim() || "",
        logoUrl: values.logoUrl?.trim() || "",
        bannerUrl: values.bannerUrl?.trim() || "",
        addressId,
      };

      const createdStore = await storeService.createMyStore(payload);
      setStore(createdStore);
      form.reset({
        ...defaultValues,
        name: createdStore?.name ?? "",
        description: createdStore?.description ?? "",
        cnpj: createdStore?.cnpj ?? "",
        logoUrl: createdStore?.logoUrl ?? "",
        bannerUrl: createdStore?.bannerUrl ?? "",
      });

      setLogoPreview(createdStore?.logoUrl ?? null);
      setBannerPreview(createdStore?.bannerUrl ?? null);

      toast.success("Loja criada com sucesso");

      if (createdStore?.melhorEnvioOnboardingUrl) {
        window.location.assign(createdStore.melhorEnvioOnboardingUrl);
        return;
      }

      await loadStatuses();
    } catch (error) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;

      if (status === 409 || code === "STORE_ALREADY_EXISTS") {
        const existingStore = await storeService.getMyStore();

        setStore(existingStore);
        form.reset({
          ...defaultValues,
          name: existingStore?.name ?? "",
          description: existingStore?.description ?? "",
          cnpj: existingStore?.cnpj ?? "",
          logoUrl: existingStore?.logoUrl ?? "",
          bannerUrl: existingStore?.bannerUrl ?? "",
        });

        setLogoPreview(existingStore?.logoUrl ?? null);
        setBannerPreview(existingStore?.bannerUrl ?? null);
        await loadStatuses();
        toast.info("Sua loja já existe. Carregamos o status atual.");
        return;
      }

      toast.error(error?.response?.data?.message || "Não foi possível criar sua loja");
    } finally {
      setIsCreatingStore(false);
    }
  };

  const openStripeOnboarding = async () => {
    if (!hasStore) return;

    setIsGeneratingStripeLink(true);

    try {
      const refreshUrl = buildAbsoluteUrl("/seller/onboarding");
      const returnUrl = buildAbsoluteUrl("/seller/onboarding");
      const result = await storeService.createStripeOnboardingLink({ refreshUrl, returnUrl });

      if (result?.onboardingUrl) {
        window.location.assign(result.onboardingUrl);
        return;
      }

      toast.success("Link do Stripe gerado com sucesso");
      await loadStatuses();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível abrir o onboarding Stripe");
    } finally {
      setIsGeneratingStripeLink(false);
    }
  };

  const openMelhorEnvioOnboarding = () => {
    const onboardingUrl = melhorEnvioStatus?.onboardingUrl;
    if (!onboardingUrl) return;

    window.location.assign(onboardingUrl);
  };

  const dispatchPayouts = async () => {
    setIsDispatchingPayouts(true);

    try {
      await storeService.dispatchMyStripePayouts();
      toast.success("Transferências pendentes disparadas");
      await loadStatuses();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível disparar transferências");
    } finally {
      setIsDispatchingPayouts(false);
    }
  };

  const onboardingMessages = [];
  if (!hasStore) {
    onboardingMessages.push("Crie a loja para liberar as integrações.");
  }
  if (stripeNeedsAction) {
    onboardingMessages.push("Finalize o Stripe para habilitar cobrança e repasses.");
  }
  if (melhorEnvioNeedsAction) {
    onboardingMessages.push("Conecte o MelhorEnvio para habilitar frete e etiquetas.");
  }

  if (authStatus === "loading") {
    return (
      <main className="min-h-[calc(100vh-130px)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] p-4 md:p-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <LoaderCircle className="animate-spin" size={18} /> Carregando onboarding do seller...
          </div>
        </div>
      </main>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <main className="min-h-[calc(100vh-130px)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-orange-200 bg-orange-50/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <LogIn size={20} /> Autenticação necessária
              </CardTitle>
              <CardDescription>Faça login para concluir o onboarding da sua operação seller.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-800">
                Depois do login, você volta para esta tela para concluir loja, Stripe e MelhorEnvio sem perder o
                contexto.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => router.push("/login?redirect=/seller/onboarding")}
                  className="h-10 bg-blue-600 text-white hover:bg-blue-700"
                >
                  Fazer login
                </Button>
                <Button
                  onClick={() => router.push("/signup?redirect=/seller/onboarding")}
                  variant="outline"
                  className="h-10 border-orange-300"
                >
                  Criar conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-130px)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[#0f172a] p-6 text-white shadow-xl md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">Onboarding Seller</p>
              <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
                Configure sua loja e as integrações que destravam o fluxo operacional.
              </h1>
              <p className="mt-4 max-w-3xl text-sm text-slate-300 md:text-base">
                A loja pode existir sem Stripe concluído, mas o checkout e o frete dependem de pontos diferentes. Aqui
                você acompanha o que falta para liberar pagamentos, repasses e logística.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["store", "melhorenvio", "stripe"].map((step) => {
                  const isActive = currentStage === step;
                  const isDone = onboardingSteps.find((item) => item.key === step)?.done;
                  return (
                    <span
                      key={step}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${
                        isActive
                          ? "border-cyan-300 bg-cyan-400/15 text-cyan-200"
                          : isDone
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                            : "border-white/10 bg-white/5 text-slate-300"
                      }`}
                    >
                      {step === "store" ? "Loja" : step === "melhorenvio" ? "MelhorEnvio" : "Stripe"}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Progresso</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-4xl font-black text-white">{completionPercent}%</span>
                <span className="pb-1 text-sm text-slate-300">do onboarding concluído</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${completionPercent}%` }} />
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Etapa atual</p>
                <p className="text-sm font-semibold text-white">{currentStageLabel}</p>
                <p className="text-sm text-slate-300">{currentStageDescription}</p>
                <p className="pt-1 text-sm text-slate-300">
                  {completedSteps}/{onboardingSteps.length} etapas concluídas
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {!hasStore ? (
              <Card
                className={`border-slate-200 bg-white shadow-sm ${
                  currentStage === "store" ? "ring-2 ring-cyan-500 shadow-lg" : ""
                }`}
              >
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <StoreIcon size={18} /> Criar loja
                  </CardTitle>
                  <CardDescription>
                    Primeiro passo do onboarding. Sem loja não há vínculo com Stripe nem MelhorEnvio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={form.handleSubmit(onCreateStore)} className="space-y-5">
                    <Controller
                      name="name"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Nome da loja</FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            placeholder="Ex: Tech Store Brasil"
                            disabled={isCreatingStore}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="description"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Descrição</FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            placeholder="Conte em poucas palavras o diferencial da sua loja"
                            disabled={isCreatingStore}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <ControlledTextField
                      control={form.control}
                      name="cnpj"
                      label="CNPJ da loja"
                      placeholder="Opcional, se a loja já tiver CNPJ"
                      disabled={isCreatingStore}
                      inputProps={{ inputMode: "numeric", autoComplete: "off" }}
                    />

                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <MapPin className="h-4 w-4 text-blue-600" /> Endereço da loja
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Obrigatório para criar a loja e liberar o MelhorEnvio. Você pode consultar o CEP para
                            preencher automaticamente.
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 rounded-full border-slate-300 bg-white"
                          onClick={handleLookupCep}
                          disabled={isCreatingStore || isLookingUpCep}
                        >
                          {isLookingUpCep ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          {isLookingUpCep ? "Buscando CEP..." : "Buscar CEP"}
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                        <ControlledTextField
                          control={form.control}
                          name="address.zipCode"
                          label="CEP"
                          placeholder="00000-000"
                          disabled={isCreatingStore || isLookingUpCep}
                          inputProps={{ inputMode: "numeric", maxLength: 9, autoComplete: "postal-code" }}
                          onBlur={handleLookupCep}
                        />
                        <div className="hidden md:block" />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ControlledTextField
                          control={form.control}
                          name="address.street"
                          label="Rua"
                          placeholder="Nome da rua"
                          disabled={isCreatingStore || isLookingUpCep}
                          inputProps={{ autoComplete: "street-address" }}
                        />
                        <ControlledTextField
                          control={form.control}
                          name="address.number"
                          label="Número"
                          placeholder="123"
                          disabled={isCreatingStore || isLookingUpCep}
                        />
                        <ControlledTextField
                          control={form.control}
                          name="address.complement"
                          label="Complemento"
                          placeholder="Apto, bloco, sala..."
                          disabled={isCreatingStore || isLookingUpCep}
                        />
                        <ControlledTextField
                          control={form.control}
                          name="address.neighborhood"
                          label="Bairro"
                          placeholder="Centro"
                          disabled={isCreatingStore || isLookingUpCep}
                        />
                        <ControlledTextField
                          control={form.control}
                          name="address.city"
                          label="Cidade"
                          placeholder="São Paulo"
                          disabled={isCreatingStore || isLookingUpCep}
                        />
                        <ControlledTextField
                          control={form.control}
                          name="address.state"
                          label="UF"
                          placeholder="SP"
                          disabled={isCreatingStore || isLookingUpCep}
                          inputProps={{ maxLength: 2, autoComplete: "address-level1" }}
                        />
                        <ControlledTextField
                          control={form.control}
                          name="address.receiverName"
                          label="Nome do responsável"
                          placeholder="Nome de quem recebe"
                          disabled={isCreatingStore || isLookingUpCep}
                        />
                        <ControlledTextField
                          control={form.control}
                          name="address.phoneNumber"
                          label="Telefone"
                          placeholder="(11) 99999-9999"
                          disabled={isCreatingStore || isLookingUpCep}
                          inputProps={{ inputMode: "tel", autoComplete: "tel" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <FieldLabel>Logo da loja</FieldLabel>
                        <p className="text-xs text-slate-500">Imagem pequena para identidade da marca.</p>
                      </div>
                      {logoPreview && (
                        <div className="relative inline-block">
                          <Image
                            src={normalizeImageSrc(logoPreview)}
                            alt="Logo preview"
                            width={80}
                            height={80}
                            className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearLogo}
                            disabled={isUploadingLogo}
                            className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white shadow-md hover:bg-slate-700 disabled:opacity-50"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="logo-upload"
                          className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <ImageIcon size={16} />
                          {isUploadingLogo ? "Enviando..." : "Escolher arquivo"}
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo || isCreatingStore}
                          className="hidden"
                        />
                      </div>
                      {form.formState.errors.logoUrl && (
                        <p className="text-xs font-medium text-rose-600">{form.formState.errors.logoUrl.message}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <FieldLabel>Banner da loja</FieldLabel>
                        <p className="text-xs text-slate-500">Imagem de destaque para a capa da loja.</p>
                      </div>
                      {bannerPreview && (
                        <div className="relative inline-block w-full">
                          <Image
                            src={normalizeImageSrc(bannerPreview)}
                            alt="Banner preview"
                            width={960}
                            height={240}
                            className="h-32 w-full rounded-xl border border-slate-200 object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearBanner}
                            disabled={isUploadingBanner}
                            className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white shadow-md hover:bg-slate-700 disabled:opacity-50"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="banner-upload"
                          className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <ImageIcon size={16} />
                          {isUploadingBanner ? "Enviando..." : "Escolher arquivo"}
                        </label>
                        <input
                          id="banner-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleBannerUpload}
                          disabled={isUploadingBanner || isCreatingStore}
                          className="hidden"
                        />
                      </div>
                      {form.formState.errors.bannerUrl && (
                        <p className="text-xs font-medium text-rose-600">{form.formState.errors.bannerUrl.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
                      disabled={isCreatingStore || isUploadingLogo || isUploadingBanner}
                    >
                      {isCreatingStore ? "Criando loja..." : "Criar loja e iniciar onboarding"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card
                className={`border-slate-200 bg-white shadow-sm ${
                  currentStage === "store" ? "ring-2 ring-cyan-500 shadow-lg" : ""
                }`}
              >
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <BadgeCheck size={18} /> Loja criada
                  </CardTitle>
                  <CardDescription>
                    A configuração base já existe. Agora o foco é liberar Stripe e MelhorEnvio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6 text-sm text-slate-700">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Nome</p>
                      <p className="mt-1 font-semibold text-slate-900">{store?.name ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Slug</p>
                      <p className="mt-1 font-semibold text-slate-900">{store?.slug ?? "-"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Descrição</p>
                    <p className="mt-1 text-slate-700">{store?.description || "Sem descrição"}</p>
                  </div>

                  {store?.logoUrl && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Logo</p>
                      <Image
                        src={normalizeImageSrc(store.logoUrl)}
                        alt="Store logo"
                        width={64}
                        height={64}
                        className="mt-2 h-16 w-16 rounded-xl object-cover"
                      />
                    </div>
                  )}

                  {store?.bannerUrl && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Banner</p>
                      <Image
                        src={normalizeImageSrc(store.bannerUrl)}
                        alt="Store banner"
                        width={960}
                        height={240}
                        className="mt-2 h-28 w-full rounded-xl object-cover"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4 grid">
            <Card
              className={`border-slate-200 bg-white shadow-sm ${
                currentStage === "melhorenvio" ? "ring-2 ring-blue-500 shadow-lg" : "opacity-95"
              }`}
            >
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Truck size={18} /> MelhorEnvio
                </CardTitle>
                <CardDescription>
                  O checkout precisa do MelhorEnvio para cotação de frete e geração de etiquetas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 text-sm text-slate-700">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatusTile label="Conectado" value={melhorEnvioStatus?.isConfigured} />
                  <StatusTile label="Ativo" value={melhorEnvioStatus?.isActive} />
                  <StatusTile label="Valido agora" value={!melhorEnvioStatus?.isExpired} />
                  <StatusTile label="Requer reconexão" value={melhorEnvioNeedsAction} />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  <p>
                    <strong>Última renovação:</strong> {formatDateTime(melhorEnvioStatus?.lastRefreshed)}
                  </p>
                  <p className="mt-1">
                    <strong>Expira em:</strong> {formatDateTime(melhorEnvioStatus?.expiresAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={refreshAllStatuses}
                    disabled={isRefreshing}
                    variant="outline"
                    className="h-11 flex-1"
                  >
                    <RefreshCcw size={16} /> {isRefreshing ? "Atualizando..." : "Atualizar status"}
                  </Button>
                  <Button
                    type="button"
                    onClick={openMelhorEnvioOnboarding}
                    disabled={!hasStore || !melhorEnvioStatus?.onboardingUrl}
                    className="h-11 flex-1 bg-[#0057b8] text-white hover:bg-[#0b4ea2]"
                  >
                    <Link2 size={16} />{" "}
                    {melhorEnvioNeedsAction ? "Abrir onboarding MelhorEnvio" : "Reabrir MelhorEnvio"}
                  </Button>
                </div>

                {melhorEnvioNeedsAction ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <p className="flex items-center gap-2 font-semibold">
                      <Clock3 size={16} /> MelhorEnvio pendente
                    </p>
                    <p className="mt-1 text-xs">
                      Sem essa integração o frete não avança. É o ponto que bloqueia o fluxo operacional da loja.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                    <p className="flex items-center gap-2 font-semibold">
                      <ShieldCheck size={16} /> MelhorEnvio ativo
                    </p>
                    <p className="mt-1 text-xs">
                      O cálculo de frete e a emissão de etiquetas já podem operar normalmente.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card
              className={`border-slate-200 bg-white shadow-sm mb-0 ${
                currentStage === "stripe" ? "ring-2 ring-slate-950 shadow-lg" : "opacity-95"
              }`}
            >
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <WalletCards size={18} /> Stripe
                </CardTitle>
                <CardDescription>
                  Pagamentos podem funcionar sem onboarding completo, mas repasses automáticos exigem a conta Stripe
                  concluída.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 text-sm text-slate-700">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatusTile label="Conta configurada" value={stripeStatus?.isConfigured} />
                  <StatusTile label="Onboarding concluído" value={stripeStatus?.detailsSubmitted} />
                  <StatusTile label="Cobrança habilitada" value={stripeStatus?.chargesEnabled} />
                  <StatusTile label="Repasses habilitados" value={stripeStatus?.payoutsEnabled} />
                </div>

                {Array.isArray(stripeStatus?.currentlyDue) && stripeStatus.currentlyDue.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <p className="flex items-center gap-2 font-semibold">
                      <AlertCircle size={16} /> Pendências Stripe
                    </p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs">
                      {stripeStatus.currentlyDue.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={refreshAllStatuses}
                    disabled={isRefreshing}
                    variant="outline"
                    className="h-11 flex-1"
                  >
                    <RefreshCcw size={16} /> {isRefreshing ? "Atualizando..." : "Atualizar status"}
                  </Button>
                  <Button
                    type="button"
                    onClick={openStripeOnboarding}
                    disabled={!hasStore || isGeneratingStripeLink}
                    className="h-11 flex-1 bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <Link2 size={16} /> {isGeneratingStripeLink ? "Abrindo..." : "Abrir onboarding Stripe"}
                  </Button>
                </div>

                {stripeStatus?.isConfigured && !stripeNeedsAction && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                    <p className="flex items-center gap-2 font-semibold">
                      <ShieldCheck size={16} /> Stripe pronto para operação
                    </p>
                    <p className="mt-1 text-xs">
                      Repasses e cobranças já estão liberados. Se houver pagamentos pendentes, você pode disparar as
                      transferências manualmente.
                    </p>
                    <Button
                      type="button"
                      onClick={dispatchPayouts}
                      disabled={isDispatchingPayouts}
                      className="mt-3 h-10 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {isDispatchingPayouts ? "Disparando transferências..." : "Disparar repasses pendentes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div
              className={
                isOnboardingComplete
                  ? "relative"
                  : "fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-[24rem] md:bottom-6 md:right-6"
              }
            >
              <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.15)] backdrop-blur">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <BadgeCheck size={18} /> O que falta fazer
                      </CardTitle>
                      <CardDescription>Checklist objetivo do que ainda bloqueia a operação completa.</CardDescription>
                    </div>

                    {!isOnboardingComplete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsChecklistExpanded((value) => !value)}
                        className="h-8 rounded-full px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        {isChecklistExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        <span className="ml-1 text-xs font-semibold">
                          {isChecklistExpanded ? "Diminuir" : "Expandir"}
                        </span>
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {isChecklistExpanded && (
                  <CardContent className="space-y-3 pt-6">
                    {onboardingMessages.length > 0 ? (
                      onboardingMessages.map((message) => (
                        <div
                          key={message}
                          className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700"
                        >
                          <CircleDashed size={18} className="mt-0.5 text-slate-500" />
                          <p>{message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                        <p className="flex items-center gap-2 font-semibold">
                          <CircleCheck size={16} /> Tudo pronto
                        </p>
                        <p className="mt-1 text-sm">
                          A loja, o Stripe e o MelhorEnvio estão prontos para o fluxo completo de vendas.{" "}
                          <Link href="/seller" className="font-bold underline">
                            Clique aqui para voltar para sua loja
                          </Link>
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}

                {!isChecklistExpanded && !isOnboardingComplete && (
                  <CardContent className="pt-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Pendências</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{onboardingMessages.length} item(ns)</p>
                      <p className="mt-1 text-xs text-slate-600">Clique em expandir para revisar os próximos passos.</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatusTile({ label, value, invert = false }) {
  const isOk = invert ? !value : Boolean(value);

  return (
    <div
      className={`rounded-2xl border p-4 ${isOk ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
    >
      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className={`mt-1 flex items-center gap-2 font-semibold ${isOk ? "text-emerald-900" : "text-slate-900"}`}>
        {isOk ? (
          <CircleCheck size={16} className="text-emerald-600" />
        ) : (
          <CircleDashed size={16} className="text-slate-500" />
        )}
        {isOk ? "Sim" : "Não"}
      </p>
    </div>
  );
}
