import { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../services/adminApi";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 🔐 Login qua API ADMIN
      const res = await adminApi.post("/auth/admin/login", {
        email,
        password,
      });

      const token = res.data.access_token;

      // Lưu token admin
      localStorage.setItem("admin_token", token);

      // Chuyển vào dashboard
      navigate("/admin/dashboard");

    } catch (err) {
      setError("❌ Sai email, mật khẩu hoặc tài khoản không phải Admin!");
    }
  };

  return (
    <div className="admin-login-container">
      <form className="admin-login-box" onSubmit={handleLogin}>
        <h2 className="admin-login-title">Admin Login</h2>

        {error && <p className="admin-error">{error}</p>}

        <input
          type="email"
          className="admin-input"
          placeholder="Email Admin..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="admin-input"
          placeholder="Mật khẩu..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="admin-login-btn">Đăng nhập</button>
      </form>
    </div>
  );
}
