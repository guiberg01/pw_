"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CartPanel } from "./CartPanel";

export function CartButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-white/90 hover:text-white/40 transition"
        aria-label="Abrir carrinho"
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {Math.min(itemCount, 99)}
          </span>
        )}
      </button>

      <CartPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
