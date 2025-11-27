import { useState, useEffect, useRef } from "react";
import { WS_URL, API_URL } from "../config";
import { FaPaperPlane, FaComments } from "react-icons/fa";
import "./EventChat.css";

export default function EventChat({ eventId, eventName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const chatEndRef = useRef(null);
  
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // 1. Tải lịch sử tin nhắn
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

  // 2. Kết nối WebSocket
  useEffect(() => {
    if (!eventId || !token) return;
    const ws = new WebSocket(`${WS_URL}/ws/event-chat/${eventId}?token=${token}`);
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch (e) { console.error(e); }
    };

    setSocket(ws);
    return () => { if (ws.readyState === 1) ws.close(); };
  }, [eventId]);

  // 3. Auto scroll
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
    }
  };

  return (
    <div className="ec-container">
      {/* Header */}
      <div className="ec-header">
        <FaComments style={{color: '#ff4b7d'}}/> 
        <span>Chat nhóm: {eventName}</span>
      </div>

      {/* Body Chat */}
      <div className="ec-body">
        {messages.length === 0 && (
          <div className="ec-empty">
            <p>Chưa có tin nhắn nào.</p>
            <p>Hãy là người đầu tiên bắt đầu trò chuyện! 👋</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`ec-msg ${msg.is_me ? "me" : "other"}`}>
            {!msg.is_me && <span className="ec-sender">{msg.sender_name}</span>}
            <div className="ec-bubble">{msg.content}</div>
            <span className="ec-time">{msg.created_at}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form className="ec-input-area" onSubmit={handleSend}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Nhập tin nhắn..." 
        />
        <button type="submit" disabled={!input.trim()}>
            <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}