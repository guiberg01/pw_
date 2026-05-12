import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const orderService = {
  async getMyOrders(params = {}) {
    const response = await api.get("/orders/me", { params });
    return extractData(response) ?? { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };
  },

  async getMyOrderById(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return extractData(response);
  },
};
