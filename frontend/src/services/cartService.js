const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const getApiUrl = (endpoint) => {
  return API_BASE ? `${API_BASE.replace(/\/$/, "")}${endpoint}` : `/api${endpoint}`;
};

export const cartService = {
  applyCoupon: async (couponCode) => {
    try {
      const res = await fetch(getApiUrl("/cart/apply-coupon"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        return {
          success: false,
          error: error.message || "Cupom inválido ou expirado",
          data: null,
        };
      }

      const data = await res.json();
      return {
        success: true,
        error: null,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao aplicar cupom",
        data: null,
      };
    }
  },

  removeCoupon: async () => {
    try {
      const res = await fetch(getApiUrl("/cart/remove-coupon"), {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        return {
          success: false,
          error: error.message || "Erro ao remover cupom",
          data: null,
        };
      }

      const data = await res.json();
      return {
        success: true,
        error: null,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao remover cupom",
        data: null,
      };
    }
  },

  getShippingOptions: async (addressId, couponCode) => {
    try {
      const payload = {
        addressId,
        ...(couponCode ? { couponCode } : {}),
      };

      const res = await fetch(getApiUrl("/checkout/shipping-options"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        return {
          success: false,
          error: error.message || "Não foi possível calcular o frete",
          data: null,
        };
      }

      const data = await res.json();
      return {
        success: true,
        error: null,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Não foi possível calcular o frete",
        data: null,
      };
    }
  },
};
