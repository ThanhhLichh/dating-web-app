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
