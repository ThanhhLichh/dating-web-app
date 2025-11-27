import { useEffect, useState } from "react";
import { MdLogout } from "react-icons/md";
import { FaBars } from "react-icons/fa";
import adminApi from "../../services/adminApi";
import "./AdminNavbar.css";
import { useNavigate } from "react-router-dom";

export default function AdminNavbar({ onToggleSidebar }) {
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.get("/auth/admin/me").then((res) => setAdmin(res.data));
  }, []);

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  return (
    <header className="admin-navbar">
      <button className="menu-btn" onClick={onToggleSidebar}>
        <FaBars />
      </button>

      <h2 className="navbar-title">Admin Dashboard</h2>

      <div className="admin-info">
        <span className="admin-name">👤 {admin?.full_name}</span>

        <button className="admin-logout-btn" onClick={logout}>
          <MdLogout />
          Logout
        </button>
      </div>
    </header>
  );
}
