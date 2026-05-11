"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { CartPanel } from "@/components/cart/CartPanel";
import { useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const [showCart, setShowCart] = useState(true);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const productId = searchParams.get("productId");
    const quantity = parseInt(searchParams.get("quantity") || "1", 10);

    if (!productId || quantity < 1) {
      router.push("/cart");
      return;
    }

    const processCheckout = async () => {
      try {
        const ok = await addToCart(productId, quantity);
        if (!ok) {
          console.error("Erro ao adicionar produto ao carrinho");
        }
      } catch (error) {
        console.error("Erro no checkout:", error);
      } finally {
        setIsProcessing(false);
      }
    };

    processCheckout();
  }, [searchParams, addToCart, router]);

  if (isProcessing) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
          <p className="text-slate-600 font-medium">Adicionando produto ao carrinho...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <CartPanel isOpen={showCart} onClose={() => setShowCart(false)} />
    </main>
  );
}
