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
// Import biến môi trường (config.js)
import { API_URL, WS_URL } from "../config"; 

export default function Messages() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); 

  // 📞 Call states
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState("voice"); 
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // 🎵 [MỚI] Audio Refs (Đảm bảo bạn có file này trong /public)
  const outgoingRingRef = useRef(new Audio('/outgoing-ring.mp3'));
  const incomingRingRef = useRef(new Audio('/incoming-ring.mp3'));

  // 🎵 [MỚI] Thiết lập lặp lại cho chuông
  useEffect(() => {
    const outRing = outgoingRingRef.current;
    const inRing = incomingRingRef.current;
    outRing.loop = true;
    inRing.loop = true;
    // Cleanup khi component unmount
    return () => { 
      outRing.pause(); 
      inRing.pause(); 
    };
  }, []);

  const toggleEmoji = () => setShowEmoji((prev) => !prev);

  // --- CÁC HÀM USEEFFECT (Đã sửa lại cú pháp) ---

  // ✅ 1. Lấy danh sách match
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

  // ✅ 2. Tự động cuộn
  useEffect(() => {
    const chatBox = messagesEndRef.current?.parentElement;
    if (chatBox) chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ✅ 3. Kết nối WebSocket Chat
  useEffect(() => {
    if (!selectedMatch) return;
    const token = localStorage.getItem("token");
    
    // Dùng biến WS_URL
    const ws = new WebSocket(`${WS_URL}/ws/chat/${selectedMatch.match_id}?token=${token}`);
    
    ws.onopen = () => console.log("🟢 WebSocket Chat connected");
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => {
          const isDuplicate = prev.some((m) => m.content === msg.content && m.sender_id === msg.sender_id && Math.abs(new Date(m.created_at) - new Date(msg.created_at)) < 2000);
          return isDuplicate ? prev : [...prev, msg];
        });
      } catch (err) { console.error("Lỗi parse message:", err); }
    };
    setSocket(ws);
    return () => ws.close();
  }, [selectedMatch]);

  // ✅ 4. Kết nối WebSocket Call
  useEffect(() => {
    if (!selectedMatch) return;
    const token = localStorage.getItem("token");
    
    const connectCallWS = async () => {
      try {
        // Dùng biến WS_URL
        await callService.connect(selectedMatch.match_id, token, WS_URL); 
        callService.onMessage((message) => {
          if (message.type === "incoming-call") {
            setIncomingCallData(message);
            setCallType(message.call_type);
            setIsIncomingCall(true);
            setIsCallModalOpen(true);
            callService.targetUserId = message.caller_id;

            // 🎵 BẬT CHUÔNG GỌI ĐẾN (Đã bỏ Mute)
            incomingRingRef.current.muted = false; 
            incomingRingRef.current.play().catch(e => console.warn("Lỗi phát chuông (đã mồi):", e));

          } else if (message.type === "call-answered") {
            setIsIncomingCall(false);
            setIsCallAccepted(true); 
            stopAllRinging();
          } else if (message.type === "call-rejected") {
            alert("❌ Cuộc gọi bị từ chối");
            handleRemoteCallEnded("📞 Cuộc gọi bị từ chối");
          } else if (message.type === "call-ended") {
            const type = message.call_type || "voice";
            const icon = type === 'video' ? '🎥' : '📞';
            const text = type === 'video' ? 'video' : 'thoại';
            handleRemoteCallEnded(`${icon} Cuộc gọi ${text} đã kết thúc`);
          }
        });
      } catch (err) { console.error("❌ Lỗi kết nối call WebSocket:", err); }
    };
    connectCallWS();
    return () => { if (callService.ws) callService.cleanup(); };
  }, [selectedMatch]);

  // --- CÁC HÀM XỬ LÝ ---

  // 🎵 [MỚI] Hàm dừng mọi tiếng chuông
  const stopAllRinging = () => {
    outgoingRingRef.current.pause();
    outgoingRingRef.current.currentTime = 0;
    incomingRingRef.current.pause();
    incomingRingRef.current.currentTime = 0;
  };

  const addSystemMessage = (content) => {
    const fakeLog = { type: 'call_log', content: content, created_at: new Date().toISOString(), sender_id: 9999, is_me: true };
    setMessages(prev => [...prev, fakeLog]);
  };

  const resetCallState = () => {
    setIsCallModalOpen(false);
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCallData(null);
    setIsIncomingCall(false);
    setIsCallAccepted(false);
    stopAllRinging(); // 🎵 Tắt chuông khi reset
  };

  const handleEndCall = () => {
    callService.endCall(callType); 
    resetCallState(); // Đã bao gồm stopAllRinging()
    const icon = callType === 'video' ? '🎥' : '📞';
    const text = callType === 'video' ? 'video' : 'thoại';
    addSystemMessage(`${icon} Cuộc gọi ${text} đã kết thúc`);
  };

  const handleRemoteCallEnded = (msgContent = '🎥 Cuộc gọi đã kết thúc') => {
    if (callService.ws) callService.cleanup();
    resetCallState(); // Đã bao gồm stopAllRinging()
    addSystemMessage(msgContent);
  };

  // ✅ [SỬA] Thêm logic "mồi" âm thanh
  const handleSelectMatch = async (m) => {
    setSelectedMatch(m);

    // 👇 [MỒI ÂM THANH] Chạy ở chế độ tắt tiếng khi user click lần đầu
    try {
      outgoingRingRef.current.muted = true;
      outgoingRingRef.current.play().catch(() => {});
      incomingRingRef.current.muted = true;
      incomingRingRef.current.play().catch(() => {});
    } catch (e) {
      console.warn("Lỗi mồi âm thanh:", e);
    }
    // 👆 HẾT PHẦN MỒI

    try {
      const data = await getMessages(m.match_id);
      setMessages(data);
    } catch (err) { console.error("❌ Lỗi tải tin nhắn:", err); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch) return;
    const message = { content: newMessage, type: 'text' }; 
    try {
      await sendMessage(selectedMatch.match_id, message);
      socket?.send(JSON.stringify(message));
      setNewMessage("");
    } catch (err) { console.error("❌ Lỗi gửi tin nhắn:", err); }
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

  // 📞 [SỬA] Xử lý cuộc gọi
  const handleStartCall = async (type) => {
    if (!selectedMatch) return;
    resetCallState(); 
    setCallType(type);
    setIsCallModalOpen(true);

    try {
      // 🎵 Bật chuông chờ (bỏ mute)
      outgoingRingRef.current.muted = false; 
      outgoingRingRef.current.play().catch(e => console.warn("Lỗi phát chuông:", e));

      const targetUserId = selectedMatch.partner_id;
      if (!targetUserId) { 
        alert("Lỗi: Không xác định người nhận"); 
        setIsCallModalOpen(false); 
        stopAllRinging(); 
        return; 
      }
      callService.targetUserId = targetUserId;
      
      const stream = await callService.startCall(targetUserId, type, (remoteStr) => {
        setRemoteStream(remoteStr);
      });
      
      setLocalStream(stream); // Fix lỗi màn hình nhỏ

    } catch (err) {
      console.error("❌ Lỗi bắt đầu gọi:", err);
      alert("Lỗi thiết bị hoặc kết nối.");
      setIsCallModalOpen(false);
      stopAllRinging(); 
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCallData) return;
    stopAllRinging(); // Tắt chuông khi chấp nhận
    try {
      callService.targetUserId = incomingCallData.caller_id;
      setIsCallAccepted(true);
      const stream = await callService.answerCall(
        incomingCallData.offer, incomingCallData.call_id, incomingCallData.call_type,
        (remoteStr) => setRemoteStream(remoteStr)
      );
      setLocalStream(stream);
      setIsIncomingCall(false);
    } catch (err) {
      console.error("❌ Lỗi trả lời:", err);
      alert("Không thể trả lời cuộc gọi.");
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    if (incomingCallData) {
      callService.targetUserId = incomingCallData.caller_id;
      callService.rejectCall(incomingCallData.call_id);
    }
    resetCallState(); 
    addSystemMessage('📞 Bạn đã từ chối cuộc gọi');
  };

  // ... (Phần return JSX giữ nguyên y hệt) ...
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
                  <img src={`${API_URL}${m.avatar_url || defaultAvatar}`} alt={m.full_name} />
                  <div className="match-info">
                    <h4>{m.full_name}</h4>
                    <span className="last-msg">
                       {m.last_message ? (m.last_message.includes("/uploads/") ? "📎 Đã gửi tệp tin" : m.last_message) : "Chưa có tin nhắn"}
                    </span>
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
                  <img src={`${API_URL}${selectedMatch.avatar_url || defaultAvatar}`} alt="avatar" />
                  <div className="chat-info"><h3>{selectedMatch.full_name}</h3><span>Đang hoạt động</span></div>
                  <div className="call-buttons">
                    <button className="btn-call-voice" onClick={() => handleStartCall("voice")} title="Gọi thoại"><FaPhone /></button>
                    <button className="btn-call-video" onClick={() => handleStartCall("video")} title="Gọi video"><FaVideo /></button>
                  </div>
                </div>

                <div className="chat-box">
                  {messages.map((msg, i) => {
                    if (msg.type === "call_log") {
                      let Icon = FaPhone; let iconColor = '#2ecc71'; 
                      if (msg.content.toLowerCase().includes("video")) Icon = FaVideo;
                      if (msg.content.includes("từ chối") || msg.content.includes("nhỡ")) { Icon = FaPhoneSlash; iconColor = '#e74c3c'; }
                      return (
                        <div key={i} className="system-message">
                          <div className="call-log-bubble">
                            <div className="icon-box"><Icon style={{color: iconColor}} /></div>
                            <div className="content-box">
                              <span className="call-title">{msg.content}</span>
                              <span className="call-time">{new Date(msg.created_at).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit"})}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className={`chat-bubble ${msg.is_me ? "me" : "other"}`}>
                        {msg.type === 'image' ? (
                            <img src={`${API_URL}${msg.content}`} alt="img" className="chat-image" onClick={() => window.open(`${API_URL}${msg.content}`, '_blank')} />
                        ) : msg.type === 'video' ? (
                            <video controls className="chat-video"><source src={`${API_URL}${msg.content}`} /></video>
                        ) : msg.type === 'file' ? (
                            <a href={`${API_URL}${msg.content}`} target="_blank" rel="noreferrer" className="chat-file-link"><FaFileAlt /> {msg.content.split('/').pop()}</a>
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
                  <button type="button" className="emoji-btn" onClick={toggleEmoji} title="Biểu cảm"><FaSmile /></button>
                  <button type="submit" title="Gửi"><FaPaperPlane /></button>
                  {showEmoji && <div className="emoji-picker"><EmojiPicker onEmojiClick={(e) => setNewMessage((prev) => prev + e.emoji)} /></div>}
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <CallModal 
        isOpen={isCallModalOpen} 
        callType={callType} 
        isIncoming={isIncomingCall} 
        isCallAccepted={isCallAccepted} 
        callerName={isIncomingCall ? incomingCallData?.caller_name : selectedMatch?.full_name} 
        localStream={localStream} 
        remoteStream={remoteStream} 
        onAccept={handleAcceptCall} 
        onReject={handleRejectCall} 
        onEnd={handleEndCall} 
        onToggleMic={() => callService.toggleMic()} 
        onToggleCamera={() => callService.toggleCamera()} 
      />
      <Footer />
    </>
  );
}