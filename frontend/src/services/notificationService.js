// services/notificationService.js
import api from "./api";

export const getNotifications = async () => {
  const token = localStorage.getItem("token");
  const res = await api.get("/notifications/", {   // ✅ thêm /
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ Gửi "thích lại"
export const likeBackUser = async (userId) => {
  const token = localStorage.getItem("token");
  const res = await api.post(`/home/${userId}/like`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ Bỏ qua người đó
export const skipUser = async (userId) => {
  const token = localStorage.getItem("token");
  const res = await api.post(`/home/${userId}/skip`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// NEW — Đánh dấu tất cả thông báo là đã đọc
export const markRead = async () => {
  const token = localStorage.getItem("token");
  const res = await api.put("/notifications/mark-read", null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
