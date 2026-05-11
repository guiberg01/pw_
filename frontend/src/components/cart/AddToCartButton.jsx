"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { ShoppingCart, AlertCircle, Check, Ellipsis } from "lucide-react";

export function AddToCartButton({ productVariantId, stock, maxPerPerson = null, compact = false }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, error: cartError } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState(null);

  const maxAllowed = Math.min(stock || 0, maxPerPerson || Infinity);

  const handleAddToCart = async (e) => {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    if (quantity < 1 || quantity > maxAllowed) {
      setLocalError(`Quantidade inválida. Máximo: ${maxAllowed}`);
      if (compact) {
        toast.error(`Quantidade inválida. Máximo: ${maxAllowed}.`);
      }
      return;
    }

    if (isOutOfStock) {
      const message = "Produto indisponível no momento.";
      setLocalError(message);
      if (compact) {
        toast.error(message);
      }
      return;
    }

    setLoading(true);
    setLocalError(null);
    setSuccess(false);

    const ok = await addToCart(productVariantId, quantity);
    if (ok) {
      setSuccess(true);
      setQuantity(1);
      setTimeout(() => setSuccess(false), 2000);
    } else if (compact) {
      toast.error(cartError || localError || "Não foi possível adicionar o produto ao carrinho.");
    }

    setLoading(false);
  };

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setLocalError(null);
    if (!isNaN(val) && val >= 1 && val <= maxAllowed) {
      setQuantity(val);
    }
  };

  const handleIncrement = () => {
    if (quantity < maxAllowed) {
      setQuantity(quantity + 1);
      setLocalError(null);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setLocalError(null);
    }
  };

  const isOutOfStock = stock <= 0;
  const error = localError || cartError;

  return (
    <div className="relative space-y-3">
      {!compact && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Quantidade:</label>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-0.5 bg-slate-50 border border-slate-300 rounded-full px-1 py-0.5">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1 || isOutOfStock}
                className="h-7 w-7 flex items-center justify-center hover:bg-slate-200 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-600 text-sm"
                aria-label="Diminuir quantidade"
                title="Diminuir"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                max={maxAllowed}
                disabled={isOutOfStock}
                className="w-10 text-center text-sm bg-transparent border-0 focus:outline-none font-semibold disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={handleIncrement}
                disabled={quantity >= maxAllowed || isOutOfStock}
                className="h-7 w-7 flex items-center justify-center hover:bg-slate-200 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-600 text-sm"
                aria-label="Aumentar quantidade"
                title="Aumentar"
              >
                +
              </button>
            </div>
            <span className="text-xs text-slate-500">Máx: {maxAllowed}</span>
          </div>
        </div>
      )}

      {!compact ? (
        <button
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock}
          className={`w-full py-2.5 rounded-md font-semibold flex items-center justify-center gap-2 transition duration-200 ${
            isOutOfStock
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : success
                ? "bg-emerald-500 text-white"
                : "bg-[#1a4f9c] text-white hover:bg-blue-700 active:scale-95"
          }`}
        >
          {loading ? (
            <>
              <Ellipsis className="h-5 w-5" /> Adicionando
            </>
          ) : success ? (
            <>
              <Check className="h-5 w-5" />
              Adicionado!
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              Adicionar ao carrinho
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock}
          className={`w-full h-9 py-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition duration-200 ${
            isOutOfStock
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : success
                ? "bg-emerald-500 text-white"
                : "bg-[#1a4f9c] text-white hover:bg-blue-700 active:scale-95"
          }`}
          aria-label="Adicionar ao carrinho"
        >
          {loading ? (
            <>
              <Ellipsis className="h-4 w-4" /> Adicionando
            </>
          ) : success ? (
            <>
              <Check className="h-4 w-4" />
              Adicionado!
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Adicionar
            </>
          )}
        </button>
      )}

      {!compact && error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!compact && isOutOfStock && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-sm text-yellow-800 font-medium">Produto indisponível no momento</p>
        </div>
      )}
    </div>
  );
}
