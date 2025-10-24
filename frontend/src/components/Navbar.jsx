import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/logo.svg";
import defaultAvatar from "../assets/default-avatar.webp";
import { FaHome, FaUser, FaComments, FaCog, FaBell } from "react-icons/fa";
import api from "../services/api";

export default function Navbar() {
  const [user, setUser] = useState({ full_name: "Người dùng", avatar: "" });
  const [showMenu, setShowMenu] = useState(false);
  const [hasMatch, setHasMatch] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Thêm tiền tố backend vào URL ảnh
        const photo = res.data.photos?.find((p) => p.is_avatar);
        const avatar = photo
          ? `http://127.0.0.1:8000${photo.url}`
          : defaultAvatar;

        setUser({
          full_name: res.data.full_name,
          avatar,
        });

        // ✅ Lưu localStorage để tránh reload nhiều lần
        localStorage.setItem(
          "user",
          JSON.stringify({ full_name: res.data.full_name, avatar })
        );
      } catch (err) {
        console.error("Lỗi tải người dùng:", err);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <nav className="navbar">
      {/* LEFT: Logo */}
      <div className="navbar-left" onClick={() => navigate("/home")}>
        <div className="brand">
          <img src={logo} alt="LoveConnect" />
          <span className="brand-name">LoveConnect</span>
        </div>
      </div>

      {/* CENTER: Links */}
      <div className="navbar-center">
        <a onClick={() => navigate("/home")} className={location.pathname === "/home" ? "active" : ""}>
          <FaHome /> Trang chủ
        </a>
        <a onClick={() => navigate("/profile")} className={location.pathname === "/profile" ? "active" : ""}>
          <FaUser /> Hồ sơ
        </a>
        <a onClick={() => navigate("/messages")} className={location.pathname === "/messages" ? "active" : ""}>
          <FaComments /> Tin nhắn
        </a>
        <a onClick={() => navigate("/settings")} className={location.pathname === "/settings" ? "active" : ""}>
          <FaCog /> Cài đặt
        </a>
      </div>

      {/* RIGHT: Notifications + User */}
      <div className="navbar-right">
        <div className="notif-icon">
          <FaBell />
          {hasMatch && <span className="notif-badge"></span>}
        </div>

        <span className="greeting">Hi, {user.full_name.split(" ")[0]}</span>

        <div
          className="avatar-wrapper"
          onClick={() => setShowMenu(!showMenu)}
        >
          <img
            src={user.avatar || defaultAvatar}
            alt="avatar"
            className="nav-avatar"
          />
          {showMenu && (
            <div className="dropdown-menu">
              <a onClick={() => navigate("/profile")}>Trang cá nhân</a>
              <button onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
