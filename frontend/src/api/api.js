import axios from "axios";
import { removeFrontendCookie } from "@/utils/cookies";
import { toast } from "sonner";

const resolveBaseURL = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return "/api";
};

export const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];
let sessionExpiredHandled = false;

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes("/auth/login") || originalRequest.url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (originalRequest.skipAutoRefresh) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");

        processQueue(null);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        if (typeof window !== "undefined") {
          removeFrontendCookie("userName");
          removeFrontendCookie("userRole");

          if (!sessionExpiredHandled) {
            sessionExpiredHandled = true;

            toast.error("Sua sessão expirou. Faça login novamente.", {
              duration: 4000,
            });
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
