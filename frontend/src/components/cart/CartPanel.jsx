"use client";

import { useCart } from "@/hooks/useCart";
import { cartService } from "@/services/cartService";
import { X, Trash2, Plus, Minus, AlertCircle, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import { useEffect, useMemo, useState } from "react";

export function CartPanel({ isOpen, onClose }) {
  const {
    items,
    itemCount,
    totalPrice,
    discount,
    finalTotal,
    loading,
    error,
    removedItems,
    guestCartId,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showShippingInput, setShowShippingInput] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [shippingPreview, setShippingPreview] = useState(null);

  const shippingTotal = useMemo(() => {
    if (!shippingPreview?.stores?.length) return 0;

    return shippingPreview.stores.reduce((sum, store) => {
      const recommendedCarrier =
        store.carriers?.find((carrier) => String(carrier.id) === String(store.recommendedCarrierId)) ||
        store.carriers?.[0];
      return sum + Number(recommendedCarrier?.shippingCost ?? recommendedCarrier?.price ?? 0);
    }, 0);
  }, [shippingPreview]);

  const baseTotal = discount ? Number(finalTotal ?? 0) : Number(totalPrice ?? 0);
  const grandTotal = baseTotal + shippingTotal;

  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    let isCancelled = false;

    const fetchAddresses = async () => {
      try {
        setShippingError("");
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        const url = apiBase ? `${apiBase.replace(/\/$/, "")}/addresses` : "/api/addresses";

        const res = await fetch(url, {
          credentials: "include",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Erro ao carregar endereços");
        }

        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];

        if (isCancelled) return;

        setAddresses(list);

        if (!selectedAddressId && list.length > 0) {
          const defaultAddress = list.find((address) => Boolean(address?.isDefault));
          setSelectedAddressId(defaultAddress?._id || list[0]?._id || "");
        }
      } catch (err) {
        if (!isCancelled) {
          setShippingError(err.message || "Não foi possível carregar os endereços");
        }
      }
    };

    fetchAddresses();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, items.length, selectedAddressId]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponError("");
    setCouponApplying(true);

    const result = await applyCoupon(couponCode);

    if (!result.success) {
      setCouponError(result.error);
    } else {
      setCouponCode("");
      setShowCouponInput(false);
    }

    setCouponApplying(false);
  };

  const handleRemoveCoupon = async () => {
    setCouponError("");
    await removeCoupon();
  };

  const handleCalculateShipping = async () => {
    if (!selectedAddressId) {
      setShippingError("Selecione um endereço para calcular o frete");
      return;
    }

    setShippingLoading(true);
    setShippingError("");

    const result = await cartService.getShippingOptions(selectedAddressId, discount?.code);

    if (!result.success) {
      setShippingError(result.error);
      setShippingPreview(null);
    } else {
      setShippingPreview(result.data);
    }

    setShippingLoading(false);
  };

  return (
    <div
      className={`fixed inset-0 z-1000 overflow-hidden transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`pointer-events-auto w-screen max-w-md transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Seu Carrinho</h2>
              <button
                onClick={onClose}
                className="rounded-md text-slate-500 transition hover:text-slate-700"
                aria-label="Fechar carrinho"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-slate-500">Carregando carrinho...</p>
                </div>
              ) : error ? (
                <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <ShoppingCartEmpty className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-500">Seu carrinho está vazio</p>
                  <p className="text-center text-sm text-slate-500">Adicione produtos para prosseguir</p>
                  <button
                    onClick={onClose}
                    className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
                  >
                    Voltar ao catálogo
                  </button>
                </div>
              ) : (
                <div className="space-y-4 relative pt-6">
                  <button
                    onClick={async () => {
                      const cleared = await clearCart();
                      if (cleared) onClose();
                    }}
                    className="px-2 text-rose-700 absolute top-0 right-0 hover:underline"
                  >
                    Limpar carrinho
                  </button>
                  {removedItems && removedItems.length > 0 && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <p className="mb-2 text-sm font-medium text-yellow-900">Avisos:</p>
                      <ul className="space-y-1">
                        {removedItems.map((item, idx) => (
                          <li key={idx} className="text-sm text-yellow-800">
                            • {item.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {items.map((item) => (
                    <CartItemRow
                      key={item.productVariant._id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && !loading && (
              <div className="space-y-4 border-t border-slate-200 px-6 py-4">
                {/* Seção de Cupom */}
                {!guestCartId && (
                  <div className="space-y-2 border-b border-slate-200 pb-4">
                    <button
                      onClick={() => setShowCouponInput(!showCouponInput)}
                      className="flex w-full items-center justify-between rounded-lg p-2 transition hover:bg-slate-50 active:bg-slate-100"
                    >
                      <h3 className="text-sm font-semibold text-slate-900">{discount ? "Cupom Aplicado" : "Cupom"}</h3>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-600 transition-transform duration-200 ${
                          showCouponInput ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showCouponInput && !discount && (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                          placeholder="Código do cupom"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                          disabled={couponApplying}
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={couponApplying || !couponCode.trim()}
                          className="rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {couponApplying ? "..." : "Aplicar"}
                        </button>
                      </form>
                    )}

                    {couponError && (
                      <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <p className="text-xs text-red-800">{couponError}</p>
                      </div>
                    )}

                    {showCouponInput && discount && (
                      <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <div>
                          <p className="text-sm font-medium text-emerald-900">Cupom: {discount.code}</p>
                          <p className="text-xs text-emerald-700">{discount.description}</p>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-emerald-600 transition hover:text-emerald-700"
                          title="Remover cupom"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Seção de Frete */}
                {!guestCartId && (
                  <div className="space-y-2 border-b border-slate-200 pb-4">
                    <button
                      onClick={() => setShowShippingInput(!showShippingInput)}
                      className="flex w-full items-center justify-between rounded-lg p-2 transition hover:bg-slate-50 active:bg-slate-100"
                    >
                      <h3 className="text-sm font-semibold text-slate-900">
                        {shippingPreview?.stores?.length > 0 ? "Frete Calculado" : "Frete"}
                      </h3>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-600 transition-transform duration-200 ${
                          showShippingInput ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showShippingInput && (
                      <div className="space-y-2 pt-2">
                        <div className="flex gap-2">
                          <select
                            value={selectedAddressId}
                            onChange={(e) => setSelectedAddressId(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                            disabled={shippingLoading || addresses.length === 0}
                          >
                            {addresses.length === 0 ? (
                              <option value="">Nenhum endereço encontrado</option>
                            ) : (
                              addresses.map((address) => (
                                <option key={address._id} value={address._id}>
                                  {address.street}, {address.number} - {address.neighborhood}
                                </option>
                              ))
                            )}
                          </select>

                          <button
                            type="button"
                            onClick={handleCalculateShipping}
                            disabled={shippingLoading || !selectedAddressId || addresses.length === 0}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {shippingLoading ? "..." : "Calcular"}
                          </button>
                        </div>

                        {shippingError && (
                          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                            <p className="text-xs text-red-800">{shippingError}</p>
                          </div>
                        )}

                        {shippingPreview?.stores?.length > 0 && (
                          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            {shippingPreview.stores.map((store) => {
                              const recommendedCarrier =
                                store.carriers?.find(
                                  (carrier) => String(carrier.id) === String(store.recommendedCarrierId),
                                ) || store.carriers?.[0];

                              return (
                                <div key={store.storeId} className="flex items-center justify-between gap-2 text-xs">
                                  <div>
                                    <p className="font-medium text-slate-800">{store.storeName}</p>
                                    <p className="text-slate-500">
                                      {recommendedCarrier?.name || "Transportadora"}
                                      {recommendedCarrier?.deliveryTime
                                        ? ` · até ${recommendedCarrier.deliveryTime} dia(s)`
                                        : ""}
                                    </p>
                                  </div>
                                  <span className="font-semibold text-slate-900">
                                    {formatCurrency(
                                      Number(recommendedCarrier?.shippingCost ?? recommendedCarrier?.price ?? 0),
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {/* 
                    {shippingPreview?.stores?.length > 0 && !showShippingInput && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                        <p className="font-medium">Frete estimado por loja</p>
                        <p className="mt-1 text-blue-700">
                          {shippingPreview.stores.length} loja(s) · Clique para ver detalhes
                        </p>
                      </div>
                      
                    )}*/}
                  </div>
                )}
                {/* Resumo de Valores */}
                <div className="space-y-2 border-b border-slate-200 pb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Subtotal ({itemCount} itens)</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(totalPrice)}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-emerald-600">
                      <span className="text-sm font-medium">Desconto ({discount.code})</span>
                      <span className="font-semibold">-{formatCurrency(totalPrice - finalTotal)}</span>
                    </div>
                  )}
                  {discount && (
                    <div className="flex justify-between pt-2 border-t border-emerald-200">
                      <span className="text-sm font-semibold text-slate-900">Total</span>
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(finalTotal)}</span>
                    </div>
                  )}
                  {shippingPreview?.stores?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Frete estimado</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(shippingTotal)}</span>
                    </div>
                  )}
                  {shippingPreview?.stores?.length > 0 && (
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-sm font-semibold text-slate-900">Total + Frete</span>
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Link href="/checkout">
                    <button
                      onClick={onClose}
                      className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      Prosseguir para checkout
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({ item, onUpdateQuantity, onRemove }) {
  const { productVariant, quantity } = item;
  const { product } = productVariant;
  const stock = productVariant.stock || 0;
  const maxPerPerson = product?.maxPerPerson || Infinity;
  const maxAllowed = Math.min(stock, maxPerPerson);
  const productDetailId = product?._id || product?.id || null;

  const handleQuantityChange = (e) => {
    const newQty = parseInt(e.target.value, 10);
    if (newQty >= 1 && newQty <= maxAllowed) {
      onUpdateQuantity(productVariant._id, newQty);
    }
  };

  const handleIncrement = () => {
    if (quantity < maxAllowed) {
      onUpdateQuantity(productVariant._id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      onUpdateQuantity(productVariant._id, quantity - 1);
    }
  };

  return (
    <div className="flex gap-3 border-b border-slate-100 pb-4 last:border-0">
      <div className="shrink-0 h-24 w-24 overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={productVariant.imageUrl || product.mainImageUrl}
          alt={product.name}
          width={100}
          height={100}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link
            href={productDetailId ? `/products/${productDetailId}` : "/products"}
            className="line-clamp-2 text-sm font-medium text-slate-900 transition hover:text-blue-600"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-xs text-slate-500">SKU: {productVariant.sku}</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(productVariant.price)}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="rounded p-1 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4 text-slate-600" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              max={maxAllowed}
              className="w-10 border-0 text-slate-800 bg-transparent text-center text-sm font-medium focus:outline-none"
            />
            <button
              onClick={handleIncrement}
              disabled={quantity >= maxAllowed}
              className="rounded p-1 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          <button
            onClick={() => onRemove(productVariant._id)}
            className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
            aria-label="Remover do carrinho"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ShoppingCartEmpty({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z"
      />
    </svg>
  );
}
