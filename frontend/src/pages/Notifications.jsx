import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getNotifications,
  likeBackUser,
  skipUser,
} from "../services/notificationService";
import { getProfileById } from "../services/userService";
import "./Notifications.css";
import "./Home.css";
import { API_URL } from "../config";

import {
  FaHeart,
  FaEye,
  FaTimes,
  FaCommentDots,
  FaPhone,
  FaClock,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaVenusMars,
  FaStar     
} from "react-icons/fa";



export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal chi tiết
  const [showDetail, setShowDetail] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  // 💠 Xử lý nội dung theo Style C đẹp nhất
  const renderContent = (n) => {
    const name = n.sender_name || "Người dùng";

    switch (n.type) {
      case "like":
        return (
          <>
            <FaHeart className="notif-icon heart" />{" "}
            <strong>{name}</strong> đã thích bạn! 💖
          </>
        );

      case "match":
        return (
          <>
            <FaStar className="notif-icon star" /> Chúc mừng! Bạn đã match với{" "}
            <strong>{name}</strong> 💕
          </>
        );

      case "message":
        return (
          <>
            <FaCommentDots className="notif-icon message" />{" "}
            <strong>{name}</strong> đã gửi tin nhắn cho bạn 💬
          </>
        );

      case "call":
        return (
          <>
            <FaPhone className="notif-icon phone" /> Bạn có cuộc gọi nhỡ từ{" "}
            <strong>{name}</strong> 📞
          </>
        );

      default:
        return n.content;
    }
  };

  // API lấy thông báo
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
    } catch {
      alert("Không thể thích lại!");
    }
  };

  // ❌ Bỏ qua
  const handleDismiss = async (notiId, senderId) => {
    try {
      await skipUser(senderId);
      setNotifications((prev) => prev.filter((n) => n.noti_id !== notiId));
    } catch (err) {
      console.error("Lỗi khi bỏ qua:", err);
    }
  };

  // 👀 Xem chi tiết
  const handleViewDetail = async (senderId) => {
    try {
      const data = await getProfileById(senderId);
      setDetailUser(data);
      setShowDetail(true);
    } catch {
      alert("Không thể tải hồ sơ chi tiết!");
    }
  };

  // 💬 Nhắn tin
  const handleGoToChat = () => {
    navigate("/messages");
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
                  src={`${API_URL}${n.sender_avatar || "/default-avatar.png"}`}
                  alt="sender"
                  className="notif-avatar"
                />

                <div className="notif-info">
                  <p className="notif-content">{renderContent(n)}</p>

                  <span className="notif-time">
                    <FaClock />{" "}
                    {new Date(n.created_at).toLocaleString("vi-VN")}
                  </span>

                  {/* LIKE */}
                  {n.type === "like" && (
                    <div className="notif-actions">
                      <button
                        className="btn-like"
                        onClick={() => handleLikeBack(n.sender_id)}
                      >
                        <FaHeart /> Thích lại
                      </button>
                      <button
                        className="btn-view"
                        onClick={() => handleViewDetail(n.sender_id)}
                      >
                        <FaEye /> Xem
                      </button>
                      <button
                        className="btn-skip"
                        onClick={() => handleDismiss(n.noti_id, n.sender_id)}
                      >
                        <FaTimes /> Bỏ qua
                      </button>
                    </div>
                  )}

                  {/* MATCH */}
                  {n.type === "match" && (
                    <div className="notif-actions">
                      <button
                        className="btn-match"
                        onClick={() => handleViewDetail(n.sender_id)}
                      >
                        <FaStar /> Xem người đã match
                      </button>
                      <button className="btn-reply" onClick={handleGoToChat}>
                        <FaCommentDots /> Nhắn tin ngay
                      </button>
                    </div>
                  )}

                  {/* MESSAGE */}
                  {n.type === "message" && (
                    <div className="notif-actions">
                      <button className="btn-reply" onClick={handleGoToChat}>
                        <FaCommentDots /> Trả lời ngay
                      </button>
                    </div>
                  )}

                  {/* CALL */}
                  {n.type === "call" && (
                    <div className="notif-actions">
                      <button
                        className="btn-view"
                        onClick={() => handleViewDetail(n.sender_id)}
                      >
                        <FaPhone /> Gọi lại
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetail && detailUser && (
  <div className="modal-overlay" onClick={() => setShowDetail(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>

      {/* CLOSE */}
      <button className="close-btn" onClick={() => setShowDetail(false)}>
        <FaTimes />
      </button>

      {/* TITLE */}
      <h2 className="modal-title">Hồ sơ chi tiết</h2>

      {/* AVATAR */}
      <img
        src={`${API_URL}${
          detailUser.photos?.find((p) => p.is_avatar)?.url ||
          "/default-avatar.png"
        }`}
        className="modal-avatar"
        alt="avatar"
      />

      {/* NAME */}
      <h2>{detailUser.full_name}</h2>

      {/* SUB INFO – CHUẨN 3 ICON */}
      <p className="modal-sub">
        <FaBirthdayCake style={{ marginRight: 6, color: "#ff4b2b" }} />
        {detailUser.birthday?.slice(0, 10) || "—"}

        &nbsp;•&nbsp;

        <FaVenusMars style={{ marginRight: 6, color: "#ff66a3" }} />
        {detailUser.gender || "—"}

        &nbsp;•&nbsp;

        <FaMapMarkerAlt style={{ marginRight: 6, color: "#ff7b66" }} />
        {detailUser.city || "—"}
      </p>

      {/* BIO */}
      <p className="modal-bio">
        {detailUser.bio || "Chưa có giới thiệu bản thân"}
      </p>

      {/* INTERESTS */}
      {detailUser.interests?.length > 0 && (
        <div className="modal-interests">
          <h4>Sở thích</h4>
          <div className="interests-list">
            {detailUser.interests.map((i, idx) => (
              <span key={idx}>{i}</span>
            ))}
          </div>
        </div>
      )}

      {/* PHOTO GALLERY */}
      {detailUser.photos?.length > 1 && (
        <div className="modal-photos">
          <h4>Bộ sưu tập ảnh</h4>
          <div className="photo-grid">
            {(detailUser.photos || [])
              .filter((p) => !p.is_avatar)
              .map((p) => (
                <img
                  key={p.photo_id}
                  src={`${API_URL}${p.url}`}
                  alt="photo"
                />
              ))}
          </div>
        </div>
      )}

    </div>
  </div>
)}



      <Footer />
    </>
  );
}
