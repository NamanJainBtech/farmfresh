import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

const authConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const registerUser = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const getAdminProducts = async (params = {}) => {
  const response = await api.get("/admin/products", { ...authConfig(), params });
  return response.data;
};

export const createAdminProduct = async (payload) => {
  const cfg = authConfig();
  const response = await api.post("/admin/products", payload, {
    ...cfg,
    headers: {
      ...cfg.headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateAdminProduct = async (id, payload) => {
  const cfg = authConfig();
  const response = await api.put(`/admin/products/${id}`, payload, {
    ...cfg,
    headers: {
      ...cfg.headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteAdminProduct = async (id) => {
  const response = await api.delete(`/admin/products/${id}`, authConfig());
  return response.data;
};

export const getAdminCategories = async () => {
  const response = await api.get("/admin/categories", authConfig());
  return response.data;
};

export const createAdminCategory = async (payload) => {
  const response = await api.post("/admin/categories", payload, authConfig());
  return response.data;
};

export const updateAdminCategory = async (id, payload) => {
  const response = await api.put(`/admin/categories/${id}`, payload, authConfig());
  return response.data;
};

export const deleteAdminCategory = async (id) => {
  const response = await api.delete(`/admin/categories/${id}`, authConfig());
  return response.data;
};

export const getAdminOrders = async () => {
  const response = await api.get("/admin/orders", authConfig());
  return response.data;
};

export const updateAdminOrderStatus = async (id, status) => {
  const response = await api.put(`/admin/orders/${id}/status`, { status }, authConfig());
  return response.data;
};

export const getSalesReport = async () => {
  const response = await api.get("/admin/reports/sales", authConfig());
  return response.data;
};

export const getPublicProducts = async (params = {}) => {
  const response = await api.get("/public/products", { params });
  return response.data;
};

export const getPublicCategories = async () => {
  const response = await api.get("/public/categories");
  return response.data;
};

export default api;
