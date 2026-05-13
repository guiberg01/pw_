import { api } from "@/api/api";

const extractItems = (response) => response.data?.data?.items ?? [];

export const categoryService = {
  async getActiveCategories({ page = 1, limit = 100 } = {}) {
    const response = await api.get("/categories", {
      params: { page, limit },
    });

    return extractItems(response);
  },

  async getAllForAdmin(params = {}) {
    const response = await api.get("/categories/admin", { params });
    return response.data?.data?.items ?? [];
  },

  async get(categoryId) {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data?.data;
  },

  async create(payload) {
    const response = await api.post("/categories", payload);
    return response.data?.data;
  },

  async update(categoryId, payload) {
    const response = await api.put(`/categories/${categoryId}`, payload);
    return response.data?.data;
  },

  async delete(categoryId) {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data?.data;
  },
};
