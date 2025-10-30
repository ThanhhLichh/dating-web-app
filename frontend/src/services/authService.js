import api from "./api";

// 🧩 Đăng ký
export const register = async (data) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

// 🔑 Đăng nhập
export const login = async (data) => {
  const res = await api.post("/auth/login", data);

  const token = res.data.access_token;
  localStorage.setItem("token", token);

  try {
    // Lấy thông tin người dùng
    const me = await api.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.setItem("user", JSON.stringify(me.data));
  } catch (err) {
    console.error("Không thể lấy thông tin user sau đăng nhập:", err);
  }

  return res.data;
};

// 🚪 Đăng xuất (chỉ thủ công)
export const logout = async () => {
  const token = localStorage.getItem("token");
  try {
    if (token) {
      await api.post("/auth/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch (err) {
    console.warn("Không thể gọi API logout:", err);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }
};
