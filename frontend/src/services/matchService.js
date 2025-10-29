import api from "./api";

export const getMatches = async () => {
  const token = localStorage.getItem("token");
  const res = await api.get("/matches/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
