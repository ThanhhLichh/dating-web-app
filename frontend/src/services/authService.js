import api from "./api";

export const register = async (data) => {
  const res = await api.post("/users/", data);
  return res.data;
};

export const login = async (data) => {
  const res = await api.post("/auth/login", data);

  // Lưu token
  const token = res.data.access_token;
  localStorage.setItem("token", token);

  // ✅ Gọi thêm API /users/me để lấy thông tin người dùng
  try {
    const me = await api.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.setItem("user", JSON.stringify(me.data));
  } catch (err) {
    console.error("Không thể lấy thông tin user sau đăng nhập:", err);
  }

  return res.data;
};
