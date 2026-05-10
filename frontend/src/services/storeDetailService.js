import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const storeDetailService = {
  async getStoreById(storeId) {
    const response = await api.get(`/stores/${storeId}`);
    return extractData(response);
  },

  async getStoreProducts(params = {}) {
    const response = await api.get("/products", { params });
    return extractData(response);
  },
};
