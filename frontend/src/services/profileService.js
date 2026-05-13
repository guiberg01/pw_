import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const profileService = {
  async getMyProfile() {
    const response = await api.get("/auth/me");
    return extractData(response);
  },

  async updateMyProfile(payload) {
    const response = await api.patch("/auth/me", payload);
    return extractData(response);
  },

  async deleteMyProfile() {
    const response = await api.delete("/auth/me");
    return extractData(response);
  },
};
