import axios from "axios";
import { API_URL } from "../config";

// 🛠 Tạo instance riêng cho Admin
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 1. Gắn admin_token vào header cho mọi request /admin
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ❗ 2. Tự xử lý token hết hạn
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
   if (error.response?.status === 401) {

    // Không bắt lỗi login admin
    if (error.config.url.includes("/auth/admin/login")) {
      return Promise.reject(error);
    }

    // Nếu không phải login → token admin hết hạn
    localStorage.removeItem("admin_token");
    alert("⚠️ Phiên Admin đã hết hạn. Vui lòng đăng nhập lại!");
    window.location.href = "/admin/login";
}

    return Promise.reject(error);
  }
);

export default adminApi;
