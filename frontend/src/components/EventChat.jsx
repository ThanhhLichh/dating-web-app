import { useState, useEffect, useRef } from "react";
import { WS_URL, API_URL } from "../config"; // 👈 Nhớ import API_URL
import { FaPaperPlane } from "react-icons/fa";
import "./EventChat.css";

export default function EventChat({ eventId, eventName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const chatEndRef = useRef(null);
  
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // ✅ 1. TẢI LỊCH SỬ TIN NHẮN (Khi eventId thay đổi)
  useEffect(() => {
    if (!eventId) return;
    
    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/events/${eventId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const history = await res.json();
                setMessages(history);
            }
        } catch (err) {
            console.error("Lỗi tải lịch sử chat", err);
        }
    };
    fetchHistory();
  }, [eventId]);

  // ✅ 2. KẾT NỐI WEBSOCKET
  useEffect(() => {
    if (!eventId || !token) return;

    const ws = new WebSocket(`${WS_URL}/ws/event-chat/${eventId}?token=${token}`);

    ws.onopen = () => console.log(`🟢 Đã vào chat room: ${eventName}`);
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Thêm tin nhắn mới vào danh sách
        setMessages((prev) => [...prev, msg]);
      } catch (e) { console.error(e); }
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, [eventId]);

  // ✅ 3. TỰ ĐỘNG CUỘN XUỐNG
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const msgData = {
      content: input,
      sender_id: user.user_id,
      type: "text"
    };

    if (socket.readyState === 1) {
        socket.send(JSON.stringify(msgData));
        setInput("");
        // Không cần setMessages ở đây vì Server sẽ gửi lại tin nhắn này qua WebSocket cho chính mình
    }
  };

  return (
    <div className="ec-container">
      <div className="ec-header">
        💬 Chat nhóm: {eventName}
      </div>

      <div className="ec-body">
        {messages.length === 0 && <p className="ec-empty">Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</p>}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`ec-msg ${msg.is_me ? "me" : "other"}`}>
            {!msg.is_me && <span className="ec-sender">{msg.sender_name}</span>}
            <div className="ec-bubble">{msg.content}</div>
            <span className="ec-time">{msg.created_at}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form className="ec-input-area" onSubmit={handleSend}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Nhắn gì đó..." 
        />
        <button type="submit"><FaPaperPlane /></button>
      </form>
    </div>
  );
}