"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { cartService } from "@/services/cartService";
import { checkoutService } from "@/services/checkoutService";
import { addressService } from "@/services/addressService";
import { paymentMethodService } from "@/services/paymentMethodService";
import { orderService } from "@/services/orderService";
import { formatCurrency } from "@/lib/formatters";
import { addressSchema } from "@/validators/address.validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckoutHeader } from "./CheckoutHeader";
import StripePaymentElement from "@/components/checkout/StripePaymentElement";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const formatCep = (value = "") => {
  const digits = String(value).replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const normalizePhone = (value = "") => String(value).replace(/\D/g, "").slice(0, 11);

const getCardLabel = (method) => {
  const parts = [method?.cardBrand, method?.last4 ? `•••• ${method.last4}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Método de pagamento";
};

function CheckoutAddressDialog({ open, onOpenChange, onCreate }) {
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const form = useForm({
    resolver: zodResolver(addressSchema),
    mode: "onBlur",
    defaultValues: {
      label: "",
      receiverName: "",
      phoneNumber: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      isDefault: false,
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
    await onCreate({
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
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo endereço de entrega</DialogTitle>
          <DialogDescription>Cadastre um endereço novo sem sair do checkout.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="label"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={field.name}>Rótulo</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Casa, trabalho..."
                    disabled={form.formState.isSubmitting}
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
                  <FieldLabel htmlFor={field.name}>Destinatário</FieldLabel>
                  <Input {...field} id={field.name} disabled={form.formState.isSubmitting} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="phoneNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Telefone</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="(00) 00000-0000"
                    disabled={form.formState.isSubmitting}
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
                  <FieldLabel htmlFor={field.name}>CEP</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="00000-000"
                      disabled={form.formState.isSubmitting || lookingUpCep}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLookupCep}
                      disabled={lookingUpCep || form.formState.isSubmitting}
                    >
                      {lookingUpCep ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
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
                  <FieldLabel htmlFor={field.name}>Rua</FieldLabel>
                  <Input {...field} id={field.name} disabled={form.formState.isSubmitting} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="number"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Número</FieldLabel>
                  <Input {...field} id={field.name} disabled={form.formState.isSubmitting} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="complement"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Complemento</FieldLabel>
                  <Input {...field} id={field.name} disabled={form.formState.isSubmitting} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="neighborhood"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Bairro</FieldLabel>
                  <Input {...field} id={field.name} disabled={form.formState.isSubmitting} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="city"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Cidade</FieldLabel>
                  <Input {...field} id={field.name} disabled={form.formState.isSubmitting} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="state"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    maxLength={2}
                    disabled={form.formState.isSubmitting}
                    className="uppercase"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Salvar endereço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddCardDialog({ open, onOpenChange, onCreated }) {
  const cardRef = useRef(null);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const cardElementRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [setupClientSecret, setSetupClientSecret] = useState("");

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!open) return;

      try {
        const result = await paymentMethodService.createMyPaymentMethodSetupIntent();
        if (!cancelled) {
          setSetupClientSecret(result?.clientSecret || "");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Não foi possível preparar o cartão para cadastro");
      }
    };

    void init();

    return () => {
      cancelled = true;
      try {
        cardElementRef.current?.unmount?.();
        cardElementRef.current = null;
        elementsRef.current = null;
        stripeRef.current = null;
      } catch {}
    };
  }, [open]);

  useEffect(() => {
    let mounted = true;

    const mountCard = async () => {
      if (!open || !setupClientSecret || !stripePromise) return;

      const stripe = await stripePromise;
      if (!mounted || !stripe) return;

      stripeRef.current = stripe;
      const elements = stripe.elements({ clientSecret: setupClientSecret });
      elementsRef.current = elements;
      const card = elements.create("card", { hidePostalCode: true });
      cardElementRef.current = card;
      card.mount(cardRef.current);
    };

    void mountCard();

    return () => {
      mounted = false;
    };
  }, [open, setupClientSecret]);

  const handleClose = () => onOpenChange(false);

  const handleSubmit = async () => {
    if (!stripeRef.current || !elementsRef.current || !cardElementRef.current) {
      toast.error("Stripe não está disponível no momento.");
      return;
    }

    if (!cardholderName.trim()) {
      toast.error("Informe o nome no cartão.");
      return;
    }

    setLoading(true);
    try {
      const { error, setupIntent } = await stripeRef.current.confirmCardSetup(setupClientSecret, {
        payment_method: {
          card: cardElementRef.current,
          billing_details: {
            name: cardholderName.trim(),
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Não foi possível confirmar o cartão");
      }

      const paymentMethodId = setupIntent?.payment_method;
      if (!paymentMethodId) {
        throw new Error("Stripe não retornou o identificador do cartão.");
      }

      await paymentMethodService.createMyPaymentMethod({
        stripePaymentMethodId: paymentMethodId,
        type: "card",
      });

      toast.success("Cartão adicionado com sucesso");
      onCreated?.();
      handleClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Não foi possível adicionar o cartão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar cartão</DialogTitle>
          <DialogDescription>Use o formulário oficial do Stripe para salvar o cartão com segurança.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <FieldLabel htmlFor="cardholderName">Nome no cartão</FieldLabel>
            <Input
              id="cardholderName"
              value={cardholderName}
              onChange={(event) => setCardholderName(event.target.value)}
              placeholder="Como no cartão"
              disabled={loading}
            />
          </div>

          <div ref={cardRef} className="rounded-md border p-3" />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !setupClientSecret}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Salvar cartão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const {
    items,
    itemCount,
    totalPrice,
    finalTotal,
    discount,
    loading: cartLoading,
    error: cartError,
    addToCart,
    clearCart,
    updateQuantity,
    decrementQuantity,
    removeItem,
    guestCartId,
  } = useCart();

  const [bootstrapping, setBootstrapping] = useState(Boolean(productId));
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [shippingOptions, setShippingOptions] = useState(null);
  const [selectedCarriersByStore, setSelectedCarriersByStore] = useState({});
  const [couponDraft, setCouponDraft] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [paymentElementClientSecret, setPaymentElementClientSecret] = useState("");
  const [paymentElementOpen, setPaymentElementOpen] = useState(false);
  const [paymentElementOrderId, setPaymentElementOrderId] = useState(null);
  const [stripePaymentElementMode, setStripePaymentElementMode] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState("");
  const initialBootstrapRef = useRef(false);
  const paymentMethodSelectionRef = useRef(false);
  const paymentElementCloseReasonRef = useRef("idle");

  const selectedAddress = useMemo(
    () => addresses.find((address) => String(address._id) === String(selectedAddressId)) ?? null,
    [addresses, selectedAddressId],
  );

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => String(method._id) === String(selectedPaymentMethodId)) ?? null,
    [paymentMethods, selectedPaymentMethodId],
  );
  const supportedPaymentMethods = useMemo(
    () => paymentMethods.filter((method) => method?.type === "card"),
    [paymentMethods],
  );

  const { shippingTotal, shippingValid } = useMemo(() => {
    if (!shippingOptions?.stores?.length) return { shippingTotal: 0, shippingValid: true };

    let valid = true;
    const total = shippingOptions.stores.reduce((sum, store) => {
      const selectedCarrierId =
        selectedCarriersByStore[store.storeId] ?? store.recommendedCarrierId ?? store.carriers?.[0]?.id;
      const selectedCarrier = store.carriers?.find((carrier) => String(carrier.id) === String(selectedCarrierId));
      if (!selectedCarrier) {
        valid = false; // selected id not present in provider response
        return sum + 0;
      }
      return sum + Number(selectedCarrier?.shippingCost ?? selectedCarrier?.price ?? 0);
    }, 0);

    return { shippingTotal: total, shippingValid: valid };
  }, [shippingOptions, selectedCarriersByStore]);

  const loadAddresses = useCallback(async () => {
    setAddressLoading(true);
    try {
      const data = await addressService.getMyAddresses();
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);

      setSelectedAddressId((current) => {
        if (current && list.some((address) => String(address._id) === String(current))) {
          return current;
        }

        const defaultAddress = list.find((address) => Boolean(address?.isDefault));
        return defaultAddress?._id || list[0]?._id || "";
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível carregar seus endereços");
    } finally {
      setAddressLoading(false);
    }
  }, []);

  const loadPaymentMethods = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const data = await paymentMethodService.getMyPaymentMethods();
      const list = Array.isArray(data) ? data : [];
      setPaymentMethods(list);

      setSelectedPaymentMethodId((current) => {
        if (current && list.some((method) => String(method._id) === String(current))) {
          return current;
        }

        const defaultMethod = list.find((method) => Boolean(method?.isDefault));
        return defaultMethod?._id || list[0]?._id || "";
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Não foi possível carregar suas formas de pagamento");
    } finally {
      setPaymentLoading(false);
    }
  }, []);

  const buyNowMode = Boolean(productId);

  const visibleItems = useMemo(() => {
    if (!buyNowMode) return items;
    const cartItem = items.find((it) => String(it?.productVariant?._id) === String(productId));
    return cartItem ? [{ ...cartItem, quantity: 1 }] : [];
  }, [buyNowMode, items, productId]);

  const checkoutRequestItems = useMemo(() => {
    if (!buyNowMode) return null;

    return visibleItems.map((item) => ({
      productVariantId: item.productVariant?._id,
      quantity: 1,
    }));
  }, [buyNowMode, visibleItems]);

  const loadShippingOptions = useCallback(
    async (addressId) => {
      const requestItems = checkoutRequestItems;
      const itemCount = requestItems ? requestItems.length : items.length;

      if (!addressId || itemCount === 0) return;

      setShippingLoading(true);
      setCheckoutError("");
      try {
        const result = await checkoutService.getShippingOptions({
          addressId,
          ...(discount?.code ? { couponCode: discount.code } : {}),
          ...(requestItems ? { items: requestItems } : {}),
        });

        setShippingOptions(result);

        const nextSelections = {};
        for (const store of result?.stores ?? []) {
          nextSelections[store.storeId] = store.recommendedCarrierId ?? store.carriers?.[0]?.id ?? "";
        }
        setSelectedCarriersByStore(nextSelections);
      } catch (error) {
        setShippingOptions(null);
        setCheckoutError(error?.response?.data?.message || "Não foi possível calcular as opções de frete");
      } finally {
        setShippingLoading(false);
      }
    },
    [checkoutRequestItems, discount, items.length],
  );

  useEffect(() => {
    if (productId && cartLoading) return;
    if (initialBootstrapRef.current) return;
    initialBootstrapRef.current = true;

    const bootstrap = async () => {
      try {
        if (productId) {
          const alreadyInCart = items.some((it) => String(it?.productVariant?._id) === String(productId));
          if (!alreadyInCart) {
            const added = await addToCart(productId, 1);
            if (!added) {
              throw new Error("Não foi possível preparar o checkout do produto selecionado.");
            }
          }
        }

        await Promise.all([loadAddresses(), loadPaymentMethods()]);
      } catch (error) {
        setCheckoutError(error?.message || "Não foi possível preparar o checkout");
      } finally {
        setBootstrapping(false);
      }
    };

    void bootstrap();
  }, [addToCart, cartLoading, items, loadAddresses, loadPaymentMethods, productId]);
  const handleQuantityChange = async (productVariantId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(productVariantId);
    } else {
      await updateQuantity(productVariantId, newQuantity);
    }
  };

  const handleRemoveItem = async (productVariantId) => {
    await removeItem(productVariantId);
  };

  const handleClearCart = async () => {
    if (confirm("Tem certeza que deseja remover todos os itens do carrinho?")) {
      await clearCart();
    }
  };

  useEffect(() => {
    if (bootstrapping || addressLoading || !selectedAddressId || visibleItems.length === 0) return;

    const fetchShippingOptions = async () => {
      setShippingLoading(true);
      setCheckoutError("");
      try {
        const result = await checkoutService.getShippingOptions({
          addressId: selectedAddressId,
          ...(discount?.code ? { couponCode: discount.code } : {}),
          ...(checkoutRequestItems ? { items: checkoutRequestItems } : {}),
        });

        setShippingOptions(result);

        const nextSelections = {};
        for (const store of result?.stores ?? []) {
          nextSelections[store.storeId] = store.recommendedCarrierId ?? store.carriers?.[0]?.id ?? "";
        }
        setSelectedCarriersByStore(nextSelections);
      } catch (error) {
        setShippingOptions(null);
        setCheckoutError(error?.response?.data?.message || "Não foi possível calcular as opções de frete");
      } finally {
        setShippingLoading(false);
      }
    };

    void fetchShippingOptions();
  }, [addressLoading, bootstrapping, checkoutRequestItems, discount, buyNowMode, visibleItems, selectedAddressId]);

  useEffect(() => {
    // Auto-select default or first payment method when loaded
    if (!paymentMethodSelectionRef.current && supportedPaymentMethods.length > 0) {
      paymentMethodSelectionRef.current = true;
      const defaultMethod = supportedPaymentMethods.find((method) => method.isDefault);
      setSelectedPaymentMethodId(defaultMethod?._id || supportedPaymentMethods[0]?._id || "");
    }
  }, [supportedPaymentMethods]);

  const handleApplyCoupon = async () => {
    const code = couponDraft.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCheckoutError("");
    try {
      const result = await cartService.applyCoupon(code);
      if (!result.success) {
        throw new Error(result.error || "Cupom inválido");
      }

      setCouponDraft("");
      toast.success("Cupom aplicado com sucesso");
    } catch (error) {
      setCheckoutError(error?.message || "Não foi possível aplicar o cupom");
      toast.error(error?.message || "Não foi possível aplicar o cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponLoading(true);
    setCheckoutError("");
    try {
      const result = await cartService.removeCoupon();
      if (!result.success) {
        throw new Error(result.error || "Não foi possível remover o cupom");
      }

      toast.success("Cupom removido");
    } catch (error) {
      setCheckoutError(error?.message || "Não foi possível remover o cupom");
      toast.error(error?.message || "Não foi possível remover o cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  const closePaymentElementSession = useCallback(() => {
    setPaymentElementOpen(false);
    setPaymentElementClientSecret("");
    setPaymentElementOrderId(null);
    setStripePaymentElementMode(false);
  }, []);

  const cancelPendingPaymentElementOrder = useCallback(async () => {
    if (!paymentElementOrderId) return true;

    try {
      await orderService.cancelOrder(paymentElementOrderId);
      return true;
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Não foi possível cancelar o pedido pendente";
      toast.error(message);
      setCheckoutError(message);
      return false;
    }
  }, [paymentElementOrderId]);

  const dismissPaymentElementSession = useCallback(
    async ({ cancelPendingOrder = true, closeReason = "cancelled" } = {}) => {
      if (cancelPendingOrder) {
        const cancelled = await cancelPendingPaymentElementOrder();
        if (!cancelled) {
          return false;
        }
      }

      paymentElementCloseReasonRef.current = closeReason;
      closePaymentElementSession();
      setCreatingOrder(false);
      return true;
    },
    [cancelPendingPaymentElementOrder, closePaymentElementSession],
  );

  const handlePaymentElementOpenChange = useCallback(
    (open) => {
      if (open) {
        setPaymentElementOpen(true);
        return;
      }

      if (paymentElementCloseReasonRef.current === "success" || paymentElementCloseReasonRef.current === "cancelled") {
        paymentElementCloseReasonRef.current = "idle";
        closePaymentElementSession();
        setCreatingOrder(false);
        return;
      }

      void dismissPaymentElementSession({ cancelPendingOrder: true, closeReason: "cancelled" });
    },
    [closePaymentElementSession, dismissPaymentElementSession],
  );

  const handleCreateAddress = async (payload) => {
    const createdAddress = await addressService.createMyAddress(payload);
    toast.success("Endereço criado com sucesso");
    setAddressDialogOpen(false);
    await loadAddresses();
    if (createdAddress?._id) {
      setSelectedAddressId(createdAddress._id);
      await loadShippingOptions(createdAddress._id);
    }
  };

  const handlePlaceOrder = async () => {
    if (!stripePromise) {
      setCheckoutError("Stripe não configurado no frontend.");
      toast.error("Stripe não configurado no frontend.");
      return;
    }

    if (
      !selectedAddressId ||
      (!selectedPaymentMethodId && !stripePaymentElementMode) ||
      !shippingOptions?.stores?.length
    ) {
      setCheckoutError("Selecione endereço, frete e forma de pagamento antes de continuar.");
      return;
    }

    // If user selected a saved card, we'll attempt immediate confirmation below.
    // Otherwise we'll open a Payment Element modal that allows other methods supported by Stripe.

    const shippingSelections = shippingOptions.stores.map((store) => ({
      storeId: store.storeId,
      carrierId: selectedCarriersByStore[store.storeId] ?? store.recommendedCarrierId ?? store.carriers?.[0]?.id,
    }));

    if (shippingSelections.some((selection) => !selection.carrierId)) {
      setCheckoutError("Selecione uma transportadora para todas as lojas.");
      return;
    }

    setCreatingOrder(true);
    setCheckoutError("");
    try {
      const payload = {
        addressId: selectedAddressId,
        ...(discount?.code ? { couponCode: discount.code } : {}),
        shippingSelections,
      };

      if (!stripePaymentElementMode && selectedPaymentMethodId) {
        payload.paymentMethodId = selectedPaymentMethodId;
      }

      if (checkoutRequestItems) {
        payload.items = checkoutRequestItems;
      }

      const result = await checkoutService.createCheckoutIntent(payload);

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Não foi possível carregar o Stripe.");
      }

      if (
        !stripePaymentElementMode &&
        selectedPaymentMethod?.type === "card" &&
        selectedPaymentMethod?.stripePaymentMethodId
      ) {
        const confirmation = await stripe.confirmCardPayment(result.paymentIntent.clientSecret, {
          payment_method: selectedPaymentMethod?.stripePaymentMethodId,
        });

        if (confirmation.error) {
          throw new Error(confirmation.error.message || "Não foi possível concluir o pagamento");
        }

        const status = confirmation.paymentIntent?.status;
        if (status !== "succeeded" && status !== "processing") {
          throw new Error("Pagamento ainda não foi concluído.");
        }

        await checkoutService.reconcileCheckoutOrderPayment(result.orderId);
      } else {
        // Open Payment Element modal to allow alternative methods (PIX, boleto, etc.)
        setPaymentElementClientSecret(result.paymentIntent.clientSecret);
        setPaymentElementOrderId(result.orderId);
        setPaymentElementOpen(true);
        // leave creatingOrder active until modal finishes
        return;
      }
      // Only clear global cart when this was a cart checkout (not buy-now)
      if (!buyNowMode) {
        await clearCart();
      }
      setCheckoutSuccess("Pedido criado com sucesso. Você será redirecionado para seus pedidos.");
      toast.success("Pagamento confirmado com sucesso");
      router.push("/pedidos?checkout=success");
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Não foi possível concluir o checkout";
      setCheckoutError(message);
      toast.error(message);
    } finally {
      setCreatingOrder(false);
    }
  };

  const isEmpty = !bootstrapping && !cartLoading && items.length === 0;

  const displaySubtotal = buyNowMode
    ? visibleItems.reduce((s, it) => s + Number(it?.productVariant?.price ?? 0) * Number(it?.quantity ?? 0), 0)
    : Number(totalPrice ?? 0);
  const displayFinal = buyNowMode ? displaySubtotal : Number(finalTotal ?? totalPrice ?? 0);
  const discountAmount = Math.max(0, Number(displaySubtotal ?? 0) - Number(displayFinal ?? displaySubtotal ?? 0));
  const grandTotal = Number(displayFinal ?? displaySubtotal ?? 0) + shippingTotal;
  const canSubmit =
    !guestCartId &&
    !creatingOrder &&
    !shippingLoading &&
    !addressLoading &&
    !paymentLoading &&
    !bootstrapping &&
    visibleItems.length > 0 &&
    selectedAddressId &&
    (selectedPaymentMethodId || stripePaymentElementMode) &&
    Boolean(shippingOptions?.stores?.length) &&
    shippingValid;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(248,250,252,1)_42%,rgba(241,245,249,1)_100%)] text-slate-900">
      <CheckoutHeader />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] lg:px-8 lg:py-8">
        <div className="space-y-6">
          {guestCartId && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Você está com um carrinho de visitante.</p>
                  <p className="mt-1 text-sm">
                    O checkout completo requer login para selecionar endereço e forma de pagamento com Stripe.
                  </p>
                  <Button asChild className="mt-3" size="sm">
                    <Link href="/login?redirect=/checkout">Entrar para continuar</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {checkoutError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">{checkoutError}</p>
              </div>
            </div>
          )}

          {checkoutSuccess && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">{checkoutSuccess}</p>
              </div>
            </div>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">1. Entrega</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Endereço de entrega</h2>
              </div>
              <Button variant="outline" onClick={() => setAddressDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Novo endereço
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {addressLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Carregando endereços...
                </div>
              ) : addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 font-medium text-slate-900">Nenhum endereço cadastrado</p>
                  <p className="mt-1 text-sm text-slate-500">Cadastre um endereço para calcular o frete.</p>
                </div>
              ) : (
                addresses.map((address) => {
                  const selected = String(address._id) === String(selectedAddressId);
                  return (
                    <button
                      key={address._id}
                      type="button"
                      onClick={() => setSelectedAddressId(address._id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">
                              {address.label || address.receiverName || "Endereço"}
                            </h3>
                            {address.isDefault && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                Padrão
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {address.street}, {address.number}
                          </p>
                          <p className="text-sm text-slate-600">
                            {address.neighborhood} - {address.city}/{address.state}
                          </p>
                          <p className="text-sm text-slate-600">CEP {address.zipCode}</p>
                        </div>
                        <div
                          className={`mt-1 h-4 w-4 rounded-full border ${selected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">2. Frete</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Escolha a entrega</h2>
              </div>
              <Truck className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-4">
              {!selectedAddress ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Selecione um endereço para calcular o frete.
                </div>
              ) : shippingLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Calculando opções de frete...
                </div>
              ) : shippingOptions?.stores?.length > 0 ? (
                shippingOptions.stores.map((store) => (
                  <div key={store.storeId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-950">{store.storeName}</h3>
                        <p className="text-xs text-slate-500">
                          {store.freeShipping ? "Frete subsidiado pela plataforma" : "Selecione a transportadora ideal"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                        {store.carriers?.length || 0} opções
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {store.carriers?.map((carrier) => {
                        const isSelected = String(selectedCarriersByStore[store.storeId] ?? "") === String(carrier.id);
                        return (
                          <button
                            key={carrier.id}
                            type="button"
                            onClick={() =>
                              setSelectedCarriersByStore((current) => ({
                                ...current,
                                [store.storeId]: carrier.id,
                              }))
                            }
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                              isSelected
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <div className="font-medium text-slate-950">{carrier.name}</div>
                              <div className="text-xs text-slate-500">
                                {carrier.deliveryTime
                                  ? `Prazo estimado: ${carrier.deliveryTime} dia(s)`
                                  : "Prazo estimado indisponível"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-slate-950">
                                {formatCurrency(Number(carrier.shippingCost ?? carrier.price ?? 0))}
                              </div>
                              {isSelected && <div className="text-[11px] font-semibold text-blue-700">Selecionado</div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Nenhuma cotação encontrada para este endereço.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">3. Cupom</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Desconto aplicado ao pedido</h2>
              </div>
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {discount ? (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div>
                    <p className="font-semibold text-emerald-900">Cupom {discount.code}</p>
                    <p className="text-sm text-emerald-800">Economia de {formatCurrency(discountAmount)}</p>
                  </div>
                  <Button variant="outline" onClick={handleRemoveCoupon} disabled={couponLoading}>
                    <X className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={couponDraft}
                    onChange={(e) => setCouponDraft(e.target.value.toUpperCase())}
                    placeholder="Digite o cupom"
                  />
                  <Button onClick={handleApplyCoupon} disabled={couponLoading || !couponDraft.trim()}>
                    {couponLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Aplicar"}
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">4. Pagamento</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Escolha a forma de pagamento</h2>
              </div>
              <CreditCard className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {paymentLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Carregando formas de pagamento...
                </div>
              ) : supportedPaymentMethods.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                  <CreditCard className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 font-medium text-slate-900">Nenhum cartão salvo</p>
                  <p className="mt-1 text-sm text-slate-500">Adicione um cartão para concluir a compra.</p>
                  <div className="mt-3">
                    <Button onClick={() => setAddCardOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar cartão
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant={stripePaymentElementMode ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setStripePaymentElementMode(true);
                        setSelectedPaymentMethodId("");
                      }}
                    >
                      {stripePaymentElementMode ? "Formas do Stripe ativadas" : "Usar outras formas do Stripe"}
                    </Button>
                  </div>
                  {stripePaymentElementMode && (
                    <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      Modo Stripe alternativo ativo. Ao finalizar, abriremos o Payment Element para escolher entre as
                      formas suportadas pelo provedor.
                    </p>
                  )}
                  {paymentMethods.length > 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Cartões salvos continuam disponíveis. Se preferir, o checkout abre o Payment Element do Stripe.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {supportedPaymentMethods.map((method) => {
                    const selected = String(method._id) === String(selectedPaymentMethodId);
                    return (
                      <button
                        key={method._id}
                        type="button"
                        onClick={() => setSelectedPaymentMethodId(method._id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                          selected
                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-950">{getCardLabel(method)}</div>
                          <div className="text-xs text-slate-500">{method.isDefault ? "Padrão" : "Cartão salvo"}</div>
                        </div>
                        <div
                          className={`h-4 w-4 rounded-full border ${selected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}
                        />
                      </button>
                    );
                  })}

                  <div className="mt-3">
                    <Button onClick={() => setAddCardOpen(true)} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar cartão
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant={stripePaymentElementMode ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setStripePaymentElementMode(true);
                        setSelectedPaymentMethodId("");
                      }}
                    >
                      {stripePaymentElementMode ? "Formas do Stripe ativadas" : "Usar outras formas do Stripe"}
                    </Button>
                  </div>
                  {stripePaymentElementMode && (
                    <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      Modo Stripe alternativo ativo. Ao finalizar, abriremos o Payment Element para escolher entre as
                      formas suportadas pelo provedor.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <section className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-200/60 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Resumo</p>
                <h2 className="mt-1 text-xl font-semibold">Revise sua compra</h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  Seu carrinho está vazio.
                </div>
              ) : (
                visibleItems.map((item) => {
                  const productVariant = item.productVariant;
                  const product = productVariant?.product ?? {};
                  const imageUrl = productVariant?.imageUrl || product?.mainImageUrl || "/placeholder-product.png";
                  return (
                    <div
                      key={productVariant?._id ?? `${product?.name}-${item.quantity}`}
                      className="flex gap-3 max-[408px]:flex-col max-[408px]:items-center rounded-2xl border border-white/10 bg-white/5 p-3 group"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                        <Image src={imageUrl} alt={product?.name || "Produto"} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex max-[408px]:flex-col items-center justify-between gap-2">
                          <div>
                            <p className="line-clamp-2 text-center text-sm font-medium">{product?.name || "Produto"}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(productVariant?._id, item.quantity - 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 text-xs text-slate-300 transition hover:border-white/40 hover:bg-white/5"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-xs font-medium text-white">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(productVariant?._id, item.quantity + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 text-xs text-slate-300 transition hover:border-white/40 hover:bg-white/5"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(Number(productVariant?.price ?? 0) * Number(item.quantity ?? 0))}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(productVariant?._id)}
                        className="self-start rounded-lg bg-white/10 p-1.5 text-slate-300 opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>Subtotal</span>
                <span>{formatCurrency(displaySubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Desconto</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Frete</span>
                <span>{formatCurrency(shippingTotal)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p>Pagamento processado com Stripe e confirmado pelo webhook do backend.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p>Pedido, repasses e notificações são disparados pelo ecossistema existente.</p>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={!canSubmit}
              className="mt-5 w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {creatingOrder ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Finalizar compra"}
            </Button>

            {!stripePromise && (
              <p className="mt-3 text-xs text-amber-300">
                Configure <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> para ativar a confirmação de pagamento no
                frontend.
              </p>
            )}
          </section>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-900">Dica prática</p>
            <p className="mt-1">Se mudar endereço ou cupom, o frete é recalculado com o backend real de checkout.</p>
          </div>
        </aside>
      </div>

      <AddCardDialog open={addCardOpen} onOpenChange={setAddCardOpen} onCreated={loadPaymentMethods} />

      <Dialog open={paymentElementOpen} onOpenChange={handlePaymentElementOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pagamento</DialogTitle>
            <DialogDescription>Use as formas habilitadas no Stripe para concluir o pedido.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {paymentElementClientSecret ? (
              <StripePaymentElement
                clientSecret={paymentElementClientSecret}
                orderId={paymentElementOrderId}
                onDone={async (errorMessage) => {
                  if (errorMessage === "cancelled") {
                    const cancelled = await dismissPaymentElementSession({
                      cancelPendingOrder: true,
                      closeReason: "cancelled",
                    });
                    if (!cancelled) {
                      return;
                    }
                    return;
                  }

                  paymentElementCloseReasonRef.current = "success";
                  closePaymentElementSession();

                  if (errorMessage) {
                    setCheckoutError(errorMessage);
                    toast.error(errorMessage);
                    setCreatingOrder(false);
                    return;
                  }

                  if (!buyNowMode) {
                    await clearCart();
                  }
                  setCheckoutSuccess("Pedido criado com sucesso. Você será redirecionado para seus pedidos.");
                  router.push("/pedidos?checkout=success");
                  setCreatingOrder(false);
                }}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Preparando Payment Element...
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                void handlePaymentElementOpenChange(false);
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CheckoutAddressDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        onCreate={handleCreateAddress}
      />
    </main>
  );
}
