import axios from "axios";
import { API_URL } from "../config"; 

// 🔧 Tạo instance axios
const api = axios.create({
  baseURL: API_URL, // URL backend FastAPI
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 1. Tự động gắn token vào tất cả request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 2. Tự động xử lý khi token hết hạn (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {

    // Nếu lỗi từ login hoặc register thì ĐỪNG xử lý ở đây
    if (error.config.url.includes("/auth/login") || 
        error.config.url.includes("/auth/register")) {
      return Promise.reject(error); 
    }

    // Nếu user không phải lỗi login → token hết hạn
    localStorage.removeItem("token");
    alert("⚠️ Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!");
    window.location.href = "/";
}

    return Promise.reject(error);
  }
);

export default api;
