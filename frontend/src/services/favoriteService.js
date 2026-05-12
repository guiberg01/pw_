import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const favoriteService = {
  async getMyFavorites(params = {}) {
    const response = await api.get("/favorites/me", { params });
    return extractData(response) ?? { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } };
  },

  async toggleFavorite(productId) {
    const response = await api.patch(`/favorites/me/${productId}/toggle`);
    return extractData(response);
  },

  async removeFavorite(productId) {
    const response = await api.delete(`/favorites/me/${productId}`);
    return extractData(response);
  },
};
