import { api } from "@/api/api";

export const productService = {
  async getAllProducts(params = {}) {
    try {
      const response = await api.get("/products", { params });
      const data = response.data?.data ?? response.data ?? {};

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data.items)) {
        return data.items;
      }

      if (Array.isArray(data.data?.items)) {
        return data.data.items;
      }

      return [];
    } catch (error) {
      console.error("Erro ao buscar produtos do backend:", error);
      return [];
    }
  },
};
