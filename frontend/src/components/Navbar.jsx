import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/logo.svg";
import defaultAvatar from "../assets/default-avatar.webp";
import { FaHome, FaUser, FaComments, FaBell } from "react-icons/fa";
import api from "../services/api";
import { getNotifications } from "../services/notificationService";
import { logout } from "../services/authService";
import { API_URL } from "../config";

export default function Navbar() {
  const [user, setUser] = useState({ full_name: "Người dùng", avatar: "" });
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);


  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ Hàm chuyển trang có bật loader ngay lập tức
  const go = (path) => {
    window.dispatchEvent(new Event("route-loading")); 
    navigate(path);
  };

  // ⭐ Lấy thông tin user hiện tại
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const photo = res.data.photos?.find((p) => p.is_avatar);
        const avatar = photo ? `${API_URL}${photo.url}` : defaultAvatar;

        setUser({ full_name: res.data.full_name, avatar });

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

  // ⭐ Lấy thông báo
  useEffect(() => {
    const fetchNotif = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error("Lỗi tải thông báo:", err);
      }
    };
    fetchNotif();
  }, []);

  const handleLikeBack = (senderId) => {
    console.log("Thích lại:", senderId);
  };

  const handleViewProfile = (senderId) => {
    go(`/profile/${senderId}`);
  };

  const handleDismiss = (notiId) => {
    setNotifications((prev) => prev.filter((n) => n.noti_id !== notiId));
  };

  return (
    <nav className="navbar">

      {/* LEFT: Logo */}
      <div className="navbar-left" onClick={() => go("/home")}>
        <div className="brand">
          <img src={logo} alt="LoveConnect" />
          <span className="brand-name">LoveConnect</span>
        </div>
      </div>

      {/* CENTER */}
      <div className="navbar-center">
        <a
          onClick={() => go("/home")}
          className={location.pathname === "/home" ? "active" : ""}
        >
          <FaHome /> Trang chủ
        </a>

        <a
          onClick={() => go("/profile")}
          className={location.pathname === "/profile" ? "active" : ""}
        >
          <FaUser /> Hồ sơ
        </a>

        <a
  onClick={() => go("/messages")}
  className={location.pathname === "/messages" ? "active" : ""}>
  <FaComments /> Tin nhắn

</a>


        <a
  onClick={() => go("/notifications")}
  className={location.pathname === "/notifications" ? "active" : ""}>
  <FaBell /> Thông báo

</a>

      </div>

      {/* RIGHT */}
      <div className="navbar-right">

        
        <span className="greeting">Hi, {user.full_name.split(" ")[0]}</span>

        <div className="avatar-wrapper" onClick={() => setShowMenu(!showMenu)}>
          <img
            src={user.avatar || defaultAvatar}
            alt="avatar"
            className="nav-avatar"
          />

          {showMenu && (
            <div className="dropdown-menu">
              <a onClick={() => go("/profile")}>Trang cá nhân</a>
              <button onClick={() => logout()}>Đăng xuất</button>
            </div>
          )}
        </div>
      </div>

      
    </nav>
  );
}
