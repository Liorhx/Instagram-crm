import axios from "axios";

// Automatically uses VITE_API_URL if configured for Vercel -> Render deployment.
// Falls back to relative "/api" for local development with Vite proxy or unified server.
const rawApiUrl = import.meta.env.VITE_API_URL || "";
const cleanBaseUrl = rawApiUrl.replace(/\/+$/, "");
const baseURL = cleanBaseUrl ? `${cleanBaseUrl}/api` : "/api";

const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const systemService = {
  getHealth: () => api.get("/health"),
};

export const authService = {
  login: (data: any) => api.post("/auth/login", data),
  signup: (data: any) => api.post("/auth/signup", data),
  getMe: () => api.get("/auth/me"),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data: any) => api.post("/auth/reset-password", data),
};

export const userService = {
  getAll: (params?: any) => api.get("/users", { params }),
  upload: (users: any[]) => api.post("/users/upload", { users }),
  analyze: (userId?: string) => api.post("/users/analyze", { userId }),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  bulkDelete: (ids: string[]) => api.post("/users/bulk-delete", { ids }),
};

export const templateService = {
  getAll: () => api.get("/templates"),
  create: (data: any) => api.post("/templates", data),
};

export const logService = {
  getAll: () => api.get("/logs"),
};

export const settingsService = {
  get: () => api.get("/settings"),
  update: (data: any) => api.patch("/settings", data),
};

export const messageService = {
  send: (data: { userId: string; templateId: string }) => api.post("/messages/send", data),
  bulkSend: (data: { userIds: string[]; templateId: string }) => api.post("/messages/bulk-send", data),
};

export default api;
