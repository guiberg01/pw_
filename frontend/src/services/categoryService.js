import { api } from "@/api/api";

const extractItems = (response) => response.data?.data?.items ?? [];

export const categoryService = {
  async getActiveCategories({ page = 1, limit = 100 } = {}) {
    const response = await api.get("/categories", {
      params: { page, limit },
    });

    return extractItems(response);
  },
};
