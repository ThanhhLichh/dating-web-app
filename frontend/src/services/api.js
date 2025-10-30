import axios from "axios";

// 🔧 Tạo instance axios
const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // URL backend FastAPI
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
      // Xóa token cũ
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Hiển thị cảnh báo (có thể thay bằng SweetAlert2 hoặc toastify)
      alert("⚠️ Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!");

      // Chuyển về trang đăng nhập
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
