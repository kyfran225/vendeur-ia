import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Request interceptor for adding the bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with mutex queue for handling 401 and seamless token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not retry refresh endpoint itself or if already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh") &&
      !originalRequest.url?.includes("/api/auth/login") &&
      !originalRequest.url?.includes("/api/auth/logout")
    ) {
      if (isRefreshing) {
        // Queue the request until active refresh finishes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        isRefreshing = false;
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data;

        useAuthStore.getState().setSession({
          ...res.data,
          accessToken,
          refreshToken: newRefreshToken
        });

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
