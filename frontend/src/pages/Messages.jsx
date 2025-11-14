import { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CallModal from "../components/CallModal";
import { getMatches } from "../services/matchService";
import { getMessages, sendMessage, uploadFile } from "../services/messageService";
import callService from "../services/callService";
import "./Messages.css";
import defaultAvatar from "../assets/default-avatar.webp";
import { 
  FaPaperPlane, FaSearch, FaComments, FaHeart, FaSmile, 
  FaPhone, FaVideo, FaPhoneSlash, FaPaperclip, FaFileAlt 
} from "react-icons/fa";

export default function Messages() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Call states
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState("voice"); 
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const toggleEmoji = () => setShowEmoji((prev) => !prev);

  // ✅ Load matches
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getMatches();
        setMatches(data);
      } catch (err) { console.error(err); }
    };
    fetchMatches();
  }, []);

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.parentElement.scrollTo({ top: messagesEndRef.current?.parentElement.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ✅ WebSocket Chat
  useEffect(() => {
    if (!selectedMatch) return;
    const token = localStorage.getItem("token");
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${selectedMatch.match_id}?token=${token}`);

    ws.onopen = () => console.log("🟢 WS connected");
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => {
          const isDuplicate = prev.some((m) => 
              m.content === msg.content && m.sender_id === msg.sender_id && 
              Math.abs(new Date(m.created_at) - new Date(msg.created_at)) < 2000
          );
          return isDuplicate ? prev : [...prev, msg];
        });
      } catch (err) { console.error(err); }
    };
    setSocket(ws);
    return () => ws.close();
  }, [selectedMatch]);

  // ✅ WebSocket Call
  useEffect(() => {
    if (!selectedMatch) return;
    const token = localStorage.getItem("token");
    
    const connectCallWS = async () => {
      try {
        await callService.connect(selectedMatch.match_id, token);
        callService.onMessage((message) => {
          if (message.type === "incoming-call") {
            setIncomingCallData(message);
            setCallType(message.call_type);
            setIsIncomingCall(true);
            setIsCallModalOpen(true);
            callService.targetUserId = message.caller_id;

          } else if (message.type === "call-answered") {
            setIsIncomingCall(false);
            setIsCallAccepted(true); 

          } else if (message.type === "call-rejected") {
            alert("❌ Cuộc gọi bị từ chối");
            handleRemoteCallEnded("📞 Cuộc gọi bị từ chối");

          } else if (message.type === "call-ended") {
            // 👇 Đọc type từ server để hiện đúng icon
            const type = message.call_type || "voice";
            const icon = type === 'video' ? '🎥' : '📞';
            const text = type === 'video' ? 'video' : 'thoại';
            handleRemoteCallEnded(`${icon} Cuộc gọi ${text} đã kết thúc`);
          }
        });
      } catch (err) { console.error(err); }
    };
    connectCallWS();
    return () => { if (callService.ws) callService.cleanup(); };
  }, [selectedMatch]);

  // --- HELPER FUNCTIONS ---

  const addSystemMessage = (content) => {
    const fakeLog = {
      type: 'call_log',
      content: content,
      created_at: new Date().toISOString(),
      sender_id: 9999, is_me: true
    };
    setMessages(prev => [...prev, fakeLog]);
  };

  const resetCallState = () => {
    setIsCallModalOpen(false);
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCallData(null);
    setIsIncomingCall(false);
    setIsCallAccepted(false);
  };

  // 👇 SỬA: Gửi callType khi tắt
  const handleEndCall = () => {
    callService.endCall(callType); 
    resetCallState();
    
    // Tạo log hiển thị đúng
    const icon = callType === 'video' ? '🎥' : '📞';
    const text = callType === 'video' ? 'video' : 'thoại';
    addSystemMessage(`${icon} Cuộc gọi ${text} đã kết thúc`);
  };

  const handleRemoteCallEnded = (msgContent) => {
    if (callService.ws) callService.cleanup();
    resetCallState();
    addSystemMessage(msgContent);
  };

  const handleSelectMatch = async (m) => {
    setSelectedMatch(m);
    try {
      const data = await getMessages(m.match_id);
      setMessages(data);
    } catch (err) { console.error(err); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch) return;
    const message = { content: newMessage, type: 'text' };
    try {
      await sendMessage(selectedMatch.match_id, message);
      socket?.send(JSON.stringify(message));
      setNewMessage("");
    } catch (err) { console.error(err); }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedMatch) return;
    try {
      const result = await uploadFile(file);
      const message = { content: result.url, type: result.type };
      await sendMessage(selectedMatch.match_id, message);
      socket?.send(JSON.stringify(message));
    } catch (err) { alert("Upload thất bại!"); } 
    finally { e.target.value = null; }
  };

  const handleStartCall = async (type) => {
    if (!selectedMatch) return;
    resetCallState();
    setCallType(type);
    setIsCallModalOpen(true);
    try {
      const targetUserId = selectedMatch.partner_id;
      if (!targetUserId) { alert("Lỗi: Không xác định người nhận"); setIsCallModalOpen(false); return; }
      callService.targetUserId = targetUserId;
      const stream = await callService.startCall(targetUserId, type, (remoteStr) => setRemoteStream(remoteStr));
      setLocalStream(stream);
    } catch (err) { alert("Lỗi thiết bị hoặc kết nối."); setIsCallModalOpen(false); }
  };

  const handleAcceptCall = async () => {
    if (!incomingCallData) return;
    try {
      callService.targetUserId = incomingCallData.caller_id;
      setIsCallAccepted(true);
      const stream = await callService.answerCall(
        incomingCallData.offer, incomingCallData.call_id, incomingCallData.call_type,
        (remoteStr) => setRemoteStream(remoteStr)
      );
      setLocalStream(stream);
      setIsIncomingCall(false);
    } catch (err) { alert("Không thể trả lời."); handleEndCall(); }
  };

  const handleRejectCall = () => {
    if (incomingCallData) {
      callService.targetUserId = incomingCallData.caller_id;
      callService.rejectCall(incomingCallData.call_id);
    }
    resetCallState();
    addSystemMessage('📞 Bạn đã từ chối cuộc gọi');
  };

  return (
    <>
      <Navbar />
      <div className="messages-page">
        <div className="messages-container">
          <div className="match-sidebar">
            <div className="sidebar-header"><FaComments className="chat-icon" /> <h2>Love Chat</h2></div>
            <div className="search-box"><FaSearch className="search-icon" /><input type="text" placeholder="Tìm kiếm..." className="match-search" /></div>
            <div className="match-list">
              {matches.map((m) => (
                <div key={m.match_id} className={`match-item ${selectedMatch?.match_id === m.match_id ? "active" : ""}`} onClick={() => handleSelectMatch(m)}>
                  <img src={`http://127.0.0.1:8000${m.avatar_url || defaultAvatar}`} alt={m.full_name} />
                  <div className="match-info">
                    <h4>{m.full_name}</h4>
                    <span className="last-msg">{m.last_message ? (m.last_message.includes("/uploads/") ? "📎 Đã gửi tệp tin" : m.last_message) : "Chưa có tin nhắn"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-section">
            {!selectedMatch ? (
              <div className="empty-chat"><FaHeart className="heart-icon" /><h2>💬 Chọn người để trò chuyện!</h2></div>
            ) : (
              <>
                <div className="chat-header">
                  <img src={`http://127.0.0.1:8000${selectedMatch.avatar_url || defaultAvatar}`} alt="avatar" />
                  <div className="chat-info"><h3>{selectedMatch.full_name}</h3><span>Đang hoạt động</span></div>
                  <div className="call-buttons">
                    <button className="btn-call-voice" onClick={() => handleStartCall("voice")}><FaPhone /></button>
                    <button className="btn-call-video" onClick={() => handleStartCall("video")}><FaVideo /></button>
                  </div>
                </div>

                <div className="chat-box">
                  {messages.map((msg, i) => {
                    // 👇 RENDER LOG: Chọn Icon thông minh dựa trên nội dung
                    if (msg.type === "call_log") {
                      let Icon = FaPhone;
                      let iconColor = '#2ecc71'; // Xanh lá

                      // Nếu nội dung có chữ "video" -> Hiện icon Camera
                      if (msg.content.toLowerCase().includes("video")) {
                          Icon = FaVideo;
                      }
                      // Nếu bị nhỡ hoặc từ chối -> Hiện icon Đỏ
                      if (msg.content.includes("từ chối") || msg.content.includes("nhỡ")) {
                          Icon = FaPhoneSlash;
                          iconColor = '#e74c3c';
                      }

                      return (
                        <div key={i} className="system-message">
                          <div className="call-log-bubble">
                            <div className="icon-box">
                              <Icon style={{color: iconColor}} />
                            </div>
                            <div className="content-box">
                              <span className="call-title">{msg.content}</span>
                              <span className="call-time">{new Date(msg.created_at).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit"})}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // RENDER TIN NHẮN THƯỜNG
                    return (
                      <div key={i} className={`chat-bubble ${msg.is_me ? "me" : "other"}`}>
                        {msg.type === 'image' ? (
                            <img src={`http://127.0.0.1:8000${msg.content}`} alt="img" className="chat-image" onClick={() => window.open(`http://127.0.0.1:8000${msg.content}`, '_blank')} />
                        ) : msg.type === 'video' ? (
                            <video controls className="chat-video"><source src={`http://127.0.0.1:8000${msg.content}`} /></video>
                        ) : msg.type === 'file' ? (
                            <a href={`http://127.0.0.1:8000${msg.content}`} target="_blank" rel="noreferrer" className="chat-file-link"><FaFileAlt /> {msg.content.split('/').pop()}</a>
                        ) : (
                            <p>{msg.content}</p>
                        )}
                        <span className="time">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form className="chat-input" onSubmit={handleSend}>
                  <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileSelect} />
                  <button type="button" className="emoji-btn" onClick={() => fileInputRef.current.click()} title="Gửi ảnh/file"><FaPaperclip /></button>
                  <input type="text" value={newMessage} placeholder="Nhập tin nhắn..." onChange={(e) => setNewMessage(e.target.value)} />
                  <button type="button" className="emoji-btn" onClick={toggleEmoji}><FaSmile /></button>
                  <button type="submit"><FaPaperPlane /></button>
                  {showEmoji && <div className="emoji-picker"><EmojiPicker onEmojiClick={(e) => setNewMessage((prev) => prev + e.emoji)} /></div>}
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <CallModal isOpen={isCallModalOpen} callType={callType} isIncoming={isIncomingCall} isCallAccepted={isCallAccepted} callerName={isIncomingCall ? incomingCallData?.caller_name : selectedMatch?.full_name} localStream={localStream} remoteStream={remoteStream} onAccept={handleAcceptCall} onReject={handleRejectCall} onEnd={handleEndCall} onToggleMic={() => callService.toggleMic()} onToggleCamera={() => callService.toggleCamera()} />
      <Footer />
    </>
  );
}