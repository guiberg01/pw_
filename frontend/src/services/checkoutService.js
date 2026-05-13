import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const checkoutService = {
  async getShippingOptions(payload) {
    const response = await api.post("/checkout/shipping-options", payload);
    return extractData(response);
  },

  async createCheckoutIntent(payload) {
    const response = await api.post("/checkout/intent", payload);
    return extractData(response);
  },

  async getCheckoutOrderDetails(orderId) {
    const response = await api.get(`/checkout/intent/${orderId}/details`);
    return extractData(response);
  },

  async resumeCheckoutIntent(orderId) {
    const response = await api.get(`/checkout/intent/${orderId}/resume`);
    return extractData(response);
  },

  async reconcileCheckoutOrderPayment(orderId) {
    const response = await api.post(`/checkout/orders/${orderId}/reconcile`);
    return extractData(response);
  },

  async reconcileCheckoutOrderPaymentUntilSettled(orderId, options = {}) {
    const maxAttempts = Number(options.maxAttempts ?? 6);
    const intervalMs = Number(options.intervalMs ?? 1200);

    let lastResult = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      lastResult = await this.reconcileCheckoutOrderPayment(orderId);

      const settled =
        lastResult?.alreadyConsistent === true ||
        (lastResult?.synchronized === true && String(lastResult?.orderStatus).toLowerCase() === "paid");

      if (settled) {
        return { ...lastResult, settled: true, attempts: attempt };
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    return { ...(lastResult ?? {}), settled: false, attempts: maxAttempts };
  },
};
