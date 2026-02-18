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

export const getCart = async () => {
  const response = await api.get("/user/cart", authConfig());
  return response.data;
};

export const addToCart = async (payload) => {
  const response = await api.post("/user/cart", payload, authConfig());
  return response.data;
};

export const updateCartItem = async (productId, quantity) => {
  const response = await api.put(`/user/cart/${productId}`, { quantity }, authConfig());
  return response.data;
};

export const removeCartItem = async (productId) => {
  const response = await api.delete(`/user/cart/${productId}`, authConfig());
  return response.data;
};

export const getAddresses = async () => {
  const response = await api.get("/user/addresses", authConfig());
  return response.data;
};

export const addAddress = async (payload) => {
  const response = await api.post("/user/addresses", payload, authConfig());
  return response.data;
};

export const deleteAddress = async (addressId) => {
  const response = await api.delete(`/user/addresses/${addressId}`, authConfig());
  return response.data;
};

export const getDeliverySlots = async () => {
  const response = await api.get("/user/delivery-slots", authConfig());
  return response.data;
};

export const placeOrder = async (order) => {
  const response = await api.post("/user/order", order, authConfig());
  return response.data;
};

export const getOrderHistory = async () => {
  const response = await api.get("/user/order/history", authConfig());
  return response.data;
};

export default api;
