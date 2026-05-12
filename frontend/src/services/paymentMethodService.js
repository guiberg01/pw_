import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const paymentMethodService = {
  async getMyPaymentMethods(params = {}) {
    const response = await api.get("/payment-methods", { params });
    return extractData(response) ?? [];
  },

  async getMyPaymentMethodById(paymentMethodId) {
    const response = await api.get(`/payment-methods/${paymentMethodId}`);
    return extractData(response);
  },

  async createMyPaymentMethod(payload) {
    const response = await api.post("/payment-methods", payload);
    return extractData(response);
  },

  async updateMyPaymentMethod(paymentMethodId, payload) {
    const response = await api.put(`/payment-methods/${paymentMethodId}`, payload);
    return extractData(response);
  },

  async setMyDefaultPaymentMethod(paymentMethodId) {
    const response = await api.patch(`/payment-methods/${paymentMethodId}/default`);
    return extractData(response);
  },

  async deleteMyPaymentMethod(paymentMethodId) {
    const response = await api.delete(`/payment-methods/${paymentMethodId}`);
    return extractData(response);
  },
};
