import { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../services/adminApi";
import "./AdminLogin.css";
import { MdAdminPanelSettings } from "react-icons/md";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await adminApi.post("/auth/admin/login", { email, password });
      localStorage.setItem("admin_token", res.data.access_token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError("❌ Sai email hoặc mật khẩu!");
    }
  };

  return (
    <div className="admin-login-page">

      <div className="admin-login-card">
        <div className="admin-login-header">
          <MdAdminPanelSettings className="admin-icon"/>
          <h2>Admin Portal</h2>
          <p>Đăng nhập để vào hệ thống quản trị</p>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email Admin</label>
            <input
              type="email"
              placeholder="Nhập email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="admin-login-btn">Đăng nhập</button>
        </form>
      </div>
    </div>
  );
}
