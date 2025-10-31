import api from "./api";

export const getProfile = async () => {
  const token = localStorage.getItem("token");
  const res = await api.get("/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getProfileById = async (id) => {
  const token = localStorage.getItem("token");
  const res = await api.get(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateProfile = async (data) => {
  const token = localStorage.getItem("token");
  const res = await api.put("/users/me", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const uploadAvatar = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/users/me/avatar", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updateInterests = async (interests) => {
  const token = localStorage.getItem("token");
  const res = await api.put("/users/me/interests", JSON.stringify(interests), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.data;
};
