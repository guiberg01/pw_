import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const reviewService = {
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
