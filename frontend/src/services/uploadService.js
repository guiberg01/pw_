import { api } from "@/api/api";

const extractData = (response) => response.data?.data;

export const uploadService = {
  async uploadImage(context, file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post(`/uploads/images/${context}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return extractData(response);
  },

  async uploadStoreLogo(file) {
    return this.uploadImage("store-logo", file);
  },

  async uploadStoreBanner(file) {
    return this.uploadImage("store-banner", file);
  },

  async uploadProductImage(file) {
    return this.uploadImage("product", file);
  },

  async uploadProfileImage(file) {
    return this.uploadImage("profile", file);
  },

  async uploadReviewImage(file) {
    return this.uploadImage("review", file);
  },
};
