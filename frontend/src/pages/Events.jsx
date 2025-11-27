import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EventChat from "../components/EventChat"; 
import { API_URL } from "../config";
import { FaMapMarkerAlt, FaClock, FaCalendarCheck, FaUsers, FaHeart, FaTimes, FaSignOutAlt, FaComments } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { likeUser } from "../services/homeService"; 
import "./Events.css"; 

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // State quản lý Modal
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list' hoặc 'chat'
  
  const [participants, setParticipants] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null); 
  const [selectedEventName, setSelectedEventName] = useState("");

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/events/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEvents(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // Xử lý Tham gia
  const handleJoin = async (eventId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/join`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Cập nhật UI: tăng số lượng + đổi trạng thái
        setEvents(prev => prev.map(ev => ev.event_id === eventId ? {...ev, is_joined: 1, current_count: (ev.current_count||0) + 1} : ev));
      } else { toast.error(data.detail); }
    } catch (err) { toast.error("Lỗi server"); }
  };

  // Xử lý Hủy
  const handleLeave = async (eventId) => {
    if(!confirm("Hủy tham gia?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/leave`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Đã hủy tham gia");
        // Cập nhật UI: giảm số lượng + đổi trạng thái
        setEvents(prev => prev.map(ev => ev.event_id === eventId ? {...ev, is_joined: 0, current_count: (ev.current_count||0) - 1} : ev));
      } else { toast.error("Lỗi hủy"); }
    } catch (err) { toast.error("Lỗi server"); }
  };

  // Hàm mở Modal (Chung cho cả List và Chat)
  const openModal = async (eventId, eventName, isJoined, mode) => {
    if (!isJoined) return toast.error(`🚫 Bạn phải tham gia mới được vào ${mode === 'chat' ? 'nhóm chat' : 'xem danh sách'}!`);

    setSelectedEventId(eventId);
    setSelectedEventName(eventName);
    setViewMode(mode); // 'list' hoặc 'chat'
    setShowModal(true);

    // Nếu xem danh sách thì gọi API lấy list, nếu chat thì không cần gọi API này
    if (mode === 'list') {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${API_URL}/events/${eventId}/participants`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) setParticipants(await res.json());
          else toast.error("Lỗi tải danh sách");
        } catch (err) { toast.error("Lỗi kết nối"); }
    }
  };

  const handleMatch = async (targetId) => {
    try { await likeUser(targetId); toast.success("Đã gửi yêu cầu Match! 💖"); } 
    catch (err) { toast.error("Lỗi khi thích."); }
  };

  return (
    <>
      <Navbar />
      <Toaster />
      
      <div className="events-page-container">
        <div className="events-header">
            <h1><FaCalendarCheck /> Sự Kiện Kết Nối</h1>
            <p>Tham gia offline, kết đôi online!</p>
        </div>

        {loading ? <p style={{textAlign:'center'}}>Đang tải...</p> : (
          <div className="events-grid">
            {events.map((ev) => {
              const isFull = (ev.current_count || 0) >= ev.max_participants;
              return (
                <div key={ev.event_id} className="event-card">
                  
                  {/* 1. ẢNH BÌA (Sạch sẽ, không có badge đè lên) */}
                  <div className="event-image-wrapper">
                      <img src={`${API_URL}${ev.image_url}`} alt={ev.title} className="event-image" 
                           onError={(e) => {e.target.src = "https://via.placeholder.com/400x200?text=Event"}} />
                  </div>
  
                  {/* 2. NỘI DUNG */}
                  <div className="event-content">
                    
                    {/* Header Row: Tiêu đề (Trái) - Số lượng (Phải) */}
                    <div className="event-header-row">
                        <h3 className="event-title">{ev.title}</h3>
                        
                        <div className={`capacity-badge ${isFull ? 'full' : 'available'}`}>
                            <FaUsers /> 
                            <span>{ev.current_count || 0}/{ev.max_participants}</span>
                        </div>
                    </div>
  
                    <div className="event-meta">
                      <span><FaClock color="#ff4b7d"/> {new Date(ev.start_time).toLocaleString('vi-VN')}</span>
                      <span><FaMapMarkerAlt color="#ff4b7d"/> {ev.location}</span>
                    </div>
  
                    <p className="event-desc">{ev.description}</p>
                    
                    <div className="event-actions">
                        {ev.is_joined ? (
                            // ĐÃ THAM GIA -> Hiện 3 nút nhỏ
                            <div className="joined-actions">
                              <button className="btn-icon btn-leave" onClick={() => handleLeave(ev.event_id)} title="Hủy tham gia">
                                  <FaSignOutAlt />
                              </button>
                              <button className="btn-icon btn-list" onClick={() => openModal(ev.event_id, ev.title, true, 'list')}>
                                  <FaUsers /> Thành viên
                              </button>
                              <button className="btn-icon btn-chat" onClick={() => openModal(ev.event_id, ev.title, true, 'chat')}>
                                  <FaComments /> Chat nhóm
                              </button>
                            </div>
                        ) : (
                            // CHƯA THAM GIA -> Nút tham gia lớn
                            <>
                              {isFull ? (
                                  <button className="btn-join disabled" disabled>🚫 Đã đầy</button>
                              ) : (
                                  <button className="btn-join" onClick={() => handleJoin(ev.event_id)}>Tham gia ngay</button>
                              )}
                            </>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL (Dùng chung cho List và Chat) --- */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content participants-modal" onClick={e => e.stopPropagation()}>
                
                {/* TRƯỜNG HỢP 1: XEM DANH SÁCH */}
                {viewMode === 'list' && (
                    <>
                        <div className="modal-header">
                            <h3>👥 Thành viên: {selectedEventName}</h3>
                            <button onClick={() => setShowModal(false)} className="close-btn"><FaTimes/></button>
                        </div>
                        <div className="participants-list">
                            {participants.length === 0 ? <p className="empty-text">Chưa có ai khác.</p> : participants.map(user => (
                                <div key={user.user_id} className="participant-item">
                                    <img src={`${API_URL}${user.avatar || "/default-avatar.png"}`} alt="avt" onError={(e)=>{e.target.src="/default-avatar.png"}} />
                                    <div className="p-info"><h4>{user.full_name}</h4><span>{user.gender === 'male' ? 'Nam' : 'Nữ'}</span></div>
                                    <button className="btn-match-small" onClick={() => handleMatch(user.user_id)}><FaHeart /> Match</button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* TRƯỜNG HỢP 2: CHAT NHÓM */}
                {viewMode === 'chat' && (
                    <div style={{height: '500px', display: 'flex', flexDirection: 'column'}}>
                        <div style={{textAlign: 'right', padding: '5px', borderBottom:'1px solid #eee'}}>
                             <button onClick={() => setShowModal(false)} className="close-btn" style={{fontSize: '1.2rem'}}><FaTimes/></button>
                        </div>
                        {/* Component Chat sẽ tự bung full chiều cao */}
                        <EventChat eventId={selectedEventId} eventName={selectedEventName} />
                    </div>
                )}

            </div>
        </div>
      )}
      
      <Footer />
    </>
  );
}