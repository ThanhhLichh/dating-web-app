import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // backend FastAPI
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Tự động gắn token vào tất cả request
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

export default api;
