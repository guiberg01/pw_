import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const storeOrderService = {
  async listMyStoreOrders(params = {}) {
    const response = await api.get("/stores/me/orders", { params });
    return (
      extractData(response) ?? { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 }, summary: null }
    );
  },

  async getMyStoreOrderById(orderId) {
    const response = await api.get(`/stores/me/orders/${orderId}`);
    return extractData(response);
  },

  async updateMyStoreOrderStatus(orderId, status) {
    const response = await api.patch(`/stores/me/orders/${orderId}/status`, { status });
    return extractData(response);
  },

  async getShippingOptions(subOrderId, { forceRecalculate = false } = {}) {
    const response = await api.get(`/shipping/orders/${subOrderId}/options`, {
      params: {
        forceRecalculate: forceRecalculate ? "true" : "false",
      },
    });
    return extractData(response);
  },

  async selectShippingOption(subOrderId, payload) {
    const response = await api.post(`/shipping/orders/${subOrderId}/select`, payload);
    return extractData(response);
  },

  async generateShippingLabel(subOrderId) {
    const response = await api.post(`/shipping/orders/${subOrderId}/label`);
    return extractData(response);
  },

  async getShippingLabel(subOrderId) {
    const response = await api.get(`/shipping/orders/${subOrderId}/label`);
    return extractData(response);
  },
};
