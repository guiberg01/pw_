import { api } from "@/api/api";

export const adminService = {
  getSummary: async () => {
    const response = await api.get("/admin/summary");
    return response.data.data;
  },

  getStores: async (params = { page: 1, limit: 20 }) => {
    const response = await api.get("/admin/stores", { params });
    return response.data.data;
  },

  updateStoreStatus: async (storeId, status) => {
    const response = await api.put(`/admin/stores/${storeId}/status`, { status });
    return response.data.data;
  },

  deleteStore: async (storeId) => {
    const response = await api.delete(`/admin/stores/${storeId}`);
    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await api.delete(`/admin/products/${productId}`);
    return response.data;
  },
};
