import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/logo.svg";
import defaultAvatar from "../assets/default-avatar.webp";
import { FaHome, FaUser, FaComments, FaBell } from "react-icons/fa";
import api from "../services/api";
import { getNotifications } from "../services/notificationService";
import { logout,  } from "../services/authService"; // ✅ import logout mới

export default function Navbar() {
  const [user, setUser] = useState({ full_name: "Người dùng", avatar: "" });
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();



  // ✅ Lấy thông tin người dùng hiện tại
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const photo = res.data.photos?.find((p) => p.is_avatar);
        const avatar = photo
          ? `http://127.0.0.1:8000${photo.url}`
          : defaultAvatar;

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

  // ✅ Lấy danh sách thông báo
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
    // TODO: gọi API /home/{senderId}/like
  };

  const handleViewProfile = (senderId) => {
    navigate(`/profile/${senderId}`);
  };

  const handleDismiss = (notiId) => {
    setNotifications((prev) => prev.filter((n) => n.noti_id !== notiId));
    // TODO: API đánh dấu đã đọc hoặc xóa thông báo
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
        <a
          onClick={() => navigate("/home")}
          className={location.pathname === "/home" ? "active" : ""}
        >
          <FaHome /> Trang chủ
        </a>
        <a
          onClick={() => navigate("/profile")}
          className={location.pathname === "/profile" ? "active" : ""}
        >
          <FaUser /> Hồ sơ
        </a>
        <a
          onClick={() => navigate("/messages")}
          className={location.pathname === "/messages" ? "active" : ""}
        >
          <FaComments /> Tin nhắn
        </a>
        <a
          onClick={() => navigate("/notifications")}
          className={location.pathname === "/notifications" ? "active" : ""}
        >
          <FaBell /> Thông báo
        </a>
      </div>

      {/* RIGHT: Notifications + User */}
      <div className="navbar-right">
        <div className="notif-icon" onClick={() => setShowNotif(!showNotif)}>
          <FaBell />
          {notifications.some((n) => !n.is_read) && (
            <span className="notif-badge"></span>
          )}
        </div>

        <span className="greeting">Hi, {user.full_name.split(" ")[0]}</span>

        <div className="avatar-wrapper" onClick={() => setShowMenu(!showMenu)}>
          <img
            src={user.avatar || defaultAvatar}
            alt="avatar"
            className="nav-avatar"
          />
          {showMenu && (
            <div className="dropdown-menu">
              <a onClick={() => navigate("/profile")}>Trang cá nhân</a>
              <button onClick={() => logout()}>Đăng xuất</button> {/* ✅ dùng logout service */}
            </div>
          )}
        </div>
      </div>

      {/* 🔔 Popup thông báo */}
      {showNotif && (
        <div className="notif-dropdown">
          {notifications.length === 0 ? (
            <p>Không có thông báo mới 💌</p>
          ) : (
            notifications.map((n) => (
              <div key={n.noti_id} className="notif-item">
                <img
                  src={`http://127.0.0.1:8000${
                    n.sender_avatar || "/default-avatar.png"
                  }`}
                  alt="sender"
                />
                <div>
                  <p
                    className="notif-content"
                    dangerouslySetInnerHTML={{ __html: n.content }}
                  />
                  {n.type === "like" && (
                    <div className="notif-actions">
                      <button onClick={() => handleLikeBack(n.sender_id)}>
                        ❤️ Thích lại
                      </button>
                      <button onClick={() => handleViewProfile(n.sender_id)}>
                        👀 Xem
                      </button>
                      <button onClick={() => handleDismiss(n.noti_id)}>
                        ❌ Bỏ qua
                      </button>
                    </div>
                  )}
                  {n.type === "match" && (
                    <div className="notif-actions">
                      <span className="match-text">🎉 Bạn đã match!</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </nav>
  );
}
