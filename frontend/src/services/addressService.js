import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const addressService = {
  async lookupCep(cep) {
    const response = await api.get("/addresses/lookup", {
      params: { cep },
    });

    return extractData(response);
  },

  async createMyAddress(payload) {
    const response = await api.post("/addresses", payload);
    return extractData(response);
  },

  async updateMyAddress(addressId, payload) {
    const response = await api.put(`/addresses/${addressId}`, payload);
    return extractData(response);
  },

  async getMyAddresses(params = {}) {
    const response = await api.get("/addresses", { params });
    return extractData(response) ?? [];
  },

  async getMyAddressById(addressId) {
    const response = await api.get(`/addresses/${addressId}`);
    return extractData(response);
  },

  async setMyDefaultAddress(addressId) {
    const response = await api.patch(`/addresses/${addressId}/default`);
    return extractData(response);
  },

  async deleteMyAddress(addressId) {
    const response = await api.delete(`/addresses/${addressId}`);
    return extractData(response);
  },
};
