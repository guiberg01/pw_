import { api } from "@/api/api";
import { uploadService } from "./uploadService";

export const storeService = {
  async getMyStore() {
    const response = await api.get("/stores/me");
    return response.data?.data ?? null;
  },

  async createMyStore(payload) {
    const response = await api.post("/stores", payload);
    return response.data?.data ?? null;
  },

  async updateMyStore(payload) {
    const response = await api.put("/stores/me", payload);
    return response.data?.data ?? null;
  },

  async updateMyStoreStatus(status) {
    const response = await api.patch("/stores/me/status", { status });
    return response.data?.data ?? null;
  },

  async getMyStripeStatus() {
    const response = await api.get("/stores/me/stripe/status");
    return response.data?.data ?? null;
  },

  async getMyMelhorEnvioStatus() {
    const response = await api.get("/stores/me/melhorenvio/status");
    return response.data?.data ?? null;
  },

  async createStripeOnboardingLink(payload) {
    const response = await api.post("/stores/me/stripe/onboarding-link", payload);
    return response.data?.data ?? null;
  },

  async dispatchMyStripePayouts() {
    const response = await api.post("/stores/me/stripe/payouts/dispatch");
    return response.data?.data ?? null;
  },

  async createMyStoreProduct(payload) {
    const response = await api.post("/stores/me/products", payload);
    return response.data?.data ?? null;
  },

  async getMyStoreProducts(params = {}) {
    const response = await api.get("/stores/me/products", { params });
    return response.data?.data ?? { items: [], pagination: {} };
  },

  async deleteProduct(productId) {
    const response = await api.delete(`/products/${productId}`);
    return response.data?.data ?? null;
  },

  async updateProduct(productId, payload) {
    const response = await api.put(`/products/${productId}`, payload);
    return response.data?.data ?? null;
  },

  async getProductById(productId) {
    const response = await api.get(`/products/${productId}`);
    return response.data?.data ?? null;
  },

  async uploadProductImage(formData) {
    const response = await api.post("/upload/product", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data ?? { url: "" };
  },

  async uploadLogo(file) {
    return uploadService.uploadStoreLogo(file);
  },

  async uploadBanner(file) {
    return uploadService.uploadStoreBanner(file);
  },
};
