import { useState, useCallback, useEffect, useRef } from "react";
import { cartService } from "@/services/cartService";

const CART_UPDATED_EVENT = "cart:updated";

export const useCart = () => {
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    totalPrice: 0,
    discount: null,
    finalTotal: 0,
    removedItems: null,
    lastUpdated: null,
    error: null,
    loading: false,
    guestCartId: null,
  });

  const requestIdRef = useRef(0);

  const notifyCartUpdated = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
    }
  }, []);

  const fetchCart = useCallback(async () => {
    setCart((prev) => ({ ...prev, loading: true, error: null }));
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    try {
      const res = await fetch("/api/cart", {
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao carregar carrinho");
      }

      const data = await res.json();

      if (requestId === requestIdRef.current) {
        setCart((prev) => ({
          ...prev,
          ...data.data,
          loading: false,
        }));
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setCart((prev) => ({ ...prev, error: error.message, loading: false }));
      }
    }
  }, []);

  const addToCart = useCallback(
    async (productVariantId, quantity = 1) => {
      try {
        const url = `/api/cart/items/${productVariantId}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
          credentials: "include",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Erro ao adicionar ao carrinho");
        }

        const data = await res.json();
        setCart((prev) => ({ ...prev, ...data.data, error: null }));
        notifyCartUpdated();
        return true;
      } catch (error) {
        setCart((prev) => ({ ...prev, error: error.message }));
        return false;
      }
    },
    [notifyCartUpdated],
  );

  const updateQuantity = useCallback(
    async (productVariantId, quantity) => {
      try {
        const res = await fetch(`/api/cart/items/${productVariantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
          credentials: "include",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Erro ao atualizar quantidade");
        }

        const data = await res.json();
        setCart((prev) => ({ ...prev, ...data.data, error: null }));
        notifyCartUpdated();
        return true;
      } catch (error) {
        setCart((prev) => ({ ...prev, error: error.message }));
        return false;
      }
    },
    [notifyCartUpdated],
  );

  const decrementQuantity = useCallback(
    async (productVariantId) => {
      try {
        const res = await fetch(`/api/cart/items/${productVariantId}/decrement`, {
          method: "PUT",
          credentials: "include",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Erro ao decrementar");
        }

        const data = await res.json();
        setCart((prev) => ({ ...prev, ...data.data, error: null }));
        notifyCartUpdated();
        return true;
      } catch (error) {
        setCart((prev) => ({ ...prev, error: error.message }));
        return false;
      }
    },
    [notifyCartUpdated],
  );

  const removeItem = useCallback(
    async (productVariantId) => {
      try {
        const res = await fetch(`/api/cart/items/${productVariantId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Erro ao remover item");
        }

        const data = await res.json();
        setCart((prev) => ({ ...prev, ...data.data, error: null }));
        notifyCartUpdated();
        return true;
      } catch (error) {
        setCart((prev) => ({ ...prev, error: error.message }));
        return false;
      }
    },
    [notifyCartUpdated],
  );

  const clearCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart/all", {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao limpar carrinho");
      }

      const data = await res.json();
      setCart((prev) => ({ ...prev, ...data.data, error: null }));
      notifyCartUpdated();
      return true;
    } catch (error) {
      setCart((prev) => ({ ...prev, error: error.message }));
      return false;
    }
  }, [notifyCartUpdated]);

  const applyCoupon = useCallback(
    async (couponCode) => {
      const result = await cartService.applyCoupon(couponCode);

      if (result.success && result.data) {
        setCart((prev) => ({ ...prev, ...result.data, error: null }));
        notifyCartUpdated();
      }

      return result;
    },
    [notifyCartUpdated],
  );

  const removeCoupon = useCallback(async () => {
    const result = await cartService.removeCoupon();

    if (result.success && result.data) {
      setCart((prev) => ({ ...prev, ...result.data, error: null }));
      notifyCartUpdated();
    }

    return result;
  }, [notifyCartUpdated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleCartUpdated = () => {
      fetchCart();
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
  }, [fetchCart]);

  return {
    // State
    items: cart.items,
    itemCount: cart.itemCount,
    totalPrice: cart.totalPrice,
    discount: cart.discount,
    finalTotal: cart.finalTotal,
    removedItems: cart.removedItems,
    loading: cart.loading,
    error: cart.error,
    guestCartId: cart.guestCartId,

    // Actions
    addToCart,
    updateQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    refetch: fetchCart,
  };
};
