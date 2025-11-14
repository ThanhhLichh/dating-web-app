import api from "./api";

export const getMessages = async (matchId) => {
  const token = localStorage.getItem("token");
  const res = await api.get(`/messages/${matchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const sendMessage = async (matchId, data) => {
  const token = localStorage.getItem("token");
  const res = await api.post(`/messages/${matchId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 👇 HÀM UPLOAD MỚI
export const uploadFile = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/messages/upload", formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data" 
    },
  });
  return res.data; // Trả về { url: "/uploads/...", type: "image" }
};