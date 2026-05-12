import { api } from "@/api/api";

const extractData = (response) => response.data?.data ?? null;

export const notificationService = {
  async getMyNotifications(params = {}) {
    const response = await api.get("/notifications", { params });
    return (
      extractData(response) ?? { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1, unreadCount: 0 } }
    );
  },

  async getUnreadCount() {
    const response = await api.get("/notifications/unread-count");
    return extractData(response) ?? { unreadCount: 0 };
  },

  async markAllAsRead() {
    const response = await api.patch("/notifications/read-all");
    return extractData(response);
  },

  async markAsRead(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return extractData(response);
  },

  async clickNotification(notificationId) {
    const response = await api.post(`/notifications/${notificationId}/click`);
    return extractData(response);
  },

  async removeNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return extractData(response);
  },

  async removeAllNotifications() {
    const response = await api.delete("/notifications");
    return extractData(response);
  },
};
