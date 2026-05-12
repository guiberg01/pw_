import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const reviewService = {
  async getMyReviews(params = {}) {
    const response = await api.get("/reviews/me", { params });
    return extractData(response) ?? { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } };
  },

  async updateMyReview(reviewId, payload) {
    const response = await api.patch(`/reviews/${reviewId}`, payload);
    return extractData(response);
  },

  async deleteMyReview(reviewId) {
    const response = await api.delete(`/reviews/${reviewId}`);
    return extractData(response);
  },

  async getMyStoreReviews(params = {}) {
    const response = await api.get("/reviews/stores/me", { params });
    return extractData(response) ?? { items: [], meta: {}, summary: {} };
  },

  async replyToReview(reviewId, comment) {
    const response = await api.put(`/reviews/${reviewId}/reply`, { comment });
    return extractData(response);
  },

  async deleteReviewReply(reviewId) {
    const response = await api.delete(`/reviews/${reviewId}/reply`);
    return extractData(response);
  },
};
