import { api } from "@/api/api";

const extractItems = (response) => response.data?.data?.items ?? response.data?.data ?? [];

export const couponService = {
  async list(params = {}) {
    const { data } = await api.get("/coupons", { params });
    return data.data?.items ?? data.data ?? [];
  },

  async get(couponId) {
    const { data } = await api.get(`/coupons/${couponId}`);
    return data.data || data;
  },

  async create(payload) {
    const { data } = await api.post("/coupons", payload);
    return data.data || data;
  },

  async getAllForAdmin(params = {}) {
    const { data } = await api.get("/coupons/admin", { params });
    return extractItems({ data });
  },

  async update(couponId, payload) {
    const { data } = await api.put(`/coupons/${couponId}`, payload);
    return data.data || data;
  },

  async delete(couponId) {
    const { data } = await api.delete(`/coupons/${couponId}`);
    return data.data || data;
  },
};
