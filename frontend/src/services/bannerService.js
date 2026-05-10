import { api } from "@/api/api";

const extractItems = (response) => response.data?.data?.items || [];
const extractData = (response) => response.data?.data;

export const bannerService = {
  async getPublicBanners() {
    try {
      const response = await api.get("/banners");
      return extractItems(response);
    } catch (error) {
      console.error("Erro ao buscar banners públicos:", error);
      return [];
    }
  },

  async getAdminBanners() {
    try {
      const response = await api.get("/banners/admin");
      return extractItems(response);
    } catch (error) {
      console.error("Erro ao buscar banners do admin:", error);
      return [];
    }
  },

  async uploadBannerImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/uploads/images/banner", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return extractData(response);
  },

  async createBanner(payload) {
    const response = await api.post("/banners", payload);
    return extractData(response);
  },

  async updateBanner(id, payload) {
    const response = await api.put(`/banners/${id}`, payload);
    return extractData(response);
  },

  async deleteBanner(id) {
    const response = await api.delete(`/banners/${id}`);
    return extractData(response);
  },
};
