import { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getMatches } from "../services/matchService";
import { getMessages, sendMessage } from "../services/messageService";
import "./Messages.css";
import defaultAvatar from "../assets/default-avatar.webp";
import { FaPaperPlane, FaSearch, FaComments, FaHeart, FaSmile } from "react-icons/fa";


export default function Messages() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const toggleEmoji = () => setShowEmoji((prev) => !prev);

  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // ✅ Load danh sách match
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getMatches();
        setMatches(data);
      } catch (err) {
        console.error("❌ Lỗi tải match:", err);
      }
    };
    fetchMatches();
  }, []);

  // ✅ Tự động cuộn xuống khi có tin mới
useEffect(() => {
  const chatBox = messagesEndRef.current?.parentElement;
  if (chatBox) {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: "smooth",
    });
  }
}, [messages]);


  // ✅ Kết nối WebSocket khi chọn match
  useEffect(() => {
    if (!selectedMatch) return;

    const token = localStorage.getItem("token");
    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/chat/${selectedMatch.match_id}?token=${token}`
    );

    ws.onopen = () => console.log("🟢 WebSocket connected");
    ws.onclose = () => console.log("🔌 WebSocket disconnected");
    ws.onerror = (e) => console.error("⚠️ WebSocket error:", e);

    // ✅ Khi nhận tin nhắn mới từ server
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch (err) {
        console.error("Lỗi parse message:", err);
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [selectedMatch]);

  // ✅ Lấy lịch sử tin nhắn khi chọn match
  const handleSelectMatch = async (m) => {
    setSelectedMatch(m);
    try {
      const data = await getMessages(m.match_id);
      setMessages(data);
    } catch (err) {
      console.error("❌ Lỗi tải tin nhắn:", err);
    }
  };

  // ✅ Gửi tin nhắn
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch) return;

    const message = { content: newMessage };

    try {
      // Gửi tới server (API để lưu DB)
      await sendMessage(selectedMatch.match_id, message);

      // Gửi qua WS realtime (server sẽ broadcast lại)
      socket?.send(JSON.stringify(message));

      // ❌ Không cần setMessages thủ công nữa
      setNewMessage("");
    } catch (err) {
      console.error("❌ Lỗi gửi tin nhắn:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="messages-page">
        <div className="messages-container">
        {/* --- SIDEBAR --- */}
        <div className="match-sidebar">
          <div className="sidebar-header">
            <FaComments className="chat-icon" />
            <h2>Love Chat</h2>
          </div>
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="match-search"
            />
          </div>

          <div className="match-list">
            {matches.length === 0 ? (
              <p className="no-match">
                💔 Chưa có ai để trò chuyện. <br />
                <a href="/home">👉 Tìm một nửa của bạn</a>
              </p>
            ) : (
              matches.map((m) => (
                <div
                  key={m.match_id}
                  className={`match-item ${
                    selectedMatch?.match_id === m.match_id ? "active" : ""
                  }`}
                  onClick={() => handleSelectMatch(m)}
                >
                  <img
                    src={`http://127.0.0.1:8000${m.avatar_url || defaultAvatar}`}
                    alt={m.full_name}
                  />
                  <div className="match-info">
                    <h4>{m.full_name}</h4>
                    <span>{m.city || "Không rõ"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- KHUNG CHAT --- */}
        <div className="chat-section">
          {!selectedMatch ? (
            <div className="empty-chat">
              <FaHeart className="heart-icon" />
              <h2>💬 Hãy chọn người để bắt đầu trò chuyện!</h2>
              <p>
                Hoặc{" "}
                <a href="/home" className="link">
                  tiếp tục tìm kiếm tình yêu ❤️
                </a>
              </p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <img
                  src={`http://127.0.0.1:8000${
                    selectedMatch.avatar_url || defaultAvatar
                  }`}
                  alt={selectedMatch.full_name}
                />
                <div className="chat-info">
                  <h3>{selectedMatch.full_name}</h3>
                  <span>Đang hoạt động</span>
                </div>
              </div>

              <div className="chat-box">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`chat-bubble ${msg.is_me ? "me" : "other"}`}
                  >
                    <p>{msg.content}</p>
                    <span className="time">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input" onSubmit={handleSend}>
  {/* Ô nhập tin nhắn */}
  <input
    type="text"
    value={newMessage}
    placeholder="Nhập tin nhắn..."
    onChange={(e) => setNewMessage(e.target.value)}
  />

  {/* Nút mở emoji */}
  <button
    type="button"
    className="emoji-btn"
    onClick={toggleEmoji}
    title="Chọn biểu tượng cảm xúc"
  >
    <FaSmile />
  </button>

  {/* Nút gửi */}
  <button type="submit" title="Gửi">
    <FaPaperPlane />
  </button>

  {/* Popup emoji */}
  {showEmoji && (
    <div className="emoji-picker">
      <EmojiPicker
        onEmojiClick={(emojiData) => {
          setNewMessage((prev) => prev + emojiData.emoji);
        }}
        searchDisabled
        skinTonesDisabled
        previewConfig={{ showPreview: false }}
        height={320}
        width={280}
      />
    </div>
  )}
</form>

            </>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
