import api from "./api";

export const getRecommendation = async (filters = {}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams(filters).toString();

  const res = await api.get(`/home/recommendations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};


export const likeUser = async (targetId) => {
  const token = localStorage.getItem("token");
  const res = await api.post(`/home/${targetId}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const skipUser = async (targetId) => {
  const token = localStorage.getItem("token");
  const res = await api.post(`/home/${targetId}/skip`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
