import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import defaultAvatar from "../assets/default-avatar.webp";
import {
  getNotifications,
  likeBackUser,
  skipUser,
} from "../services/notificationService";
import "./Notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Lấy danh sách thông báo khi vào trang
  useEffect(() => {
    const fetchNotif = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error("Lỗi tải thông báo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotif();
  }, []);

  // ❤️ Thích lại
  const handleLikeBack = async (senderId) => {
    try {
      await likeBackUser(senderId);
      alert("💖 Bạn đã thích lại người này!");
      const updated = await getNotifications();
      setNotifications(updated);
    } catch (err) {
      console.error("Lỗi khi thích lại:", err);
      alert("Không thể thích lại người này!");
    }
  };

  // ❌ Bỏ qua người gửi
  const handleDismiss = async (notiId, senderId) => {
    try {
      await skipUser(senderId);
      setNotifications((prev) => prev.filter((n) => n.noti_id !== notiId));
    } catch (err) {
      console.error("Lỗi khi bỏ qua:", err);
    }
  };

  // 👀 Xem trang cá nhân
  const handleViewProfile = (senderId) => {
    navigate(`/profile/${senderId}`);
  };

  return (
    <>
      <Navbar />

      <div className="notifications-page">
        <h1>🔔 Thông báo của bạn</h1>

        {loading ? (
          <p className="loading">Đang tải...</p>
        ) : notifications.length === 0 ? (
          <p className="no-notif">Không có thông báo mới 💌</p>
        ) : (
          <div className="notif-list">
            {notifications.map((n) => (
              <div
                key={n.noti_id}
                className={`notif-card ${n.is_read ? "read" : "unread"}`}
              >
                <img
                  src={`http://127.0.0.1:8000${
                    n.sender_avatar || "/default-avatar.png"
                  }`}
                  alt="sender"
                  className="notif-avatar"
                />

                <div className="notif-info">
                  <p
                    className="notif-content"
                    dangerouslySetInnerHTML={{ __html: n.content }}
                  />
                  <span className="notif-time">
                    🕒 {new Date(n.created_at).toLocaleString("vi-VN")}
                  </span>

                  {/* Nếu là thông báo "LIKE" */}
                  {n.type === "like" && (
                    <div className="notif-actions">
                      <button
                        className="btn-like"
                        onClick={() => handleLikeBack(n.sender_id)}
                      >
                        ❤️ Thích lại
                      </button>
                      <button
                        className="btn-view"
                        onClick={() => handleViewProfile(n.sender_id)}
                      >
                        👀 Xem
                      </button>
                      <button
                        className="btn-skip"
                        onClick={() => handleDismiss(n.noti_id, n.sender_id)}
                      >
                        ❌ Bỏ qua
                      </button>
                    </div>
                  )}

                  {/* Nếu là thông báo "MATCH" */}
                  {n.type === "match" && (
                    <div className="notif-actions">
                      <button
                        className="btn-match"
                        onClick={() => handleViewProfile(n.sender_id)}
                      >
                        🎉 Xem người đã match
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
