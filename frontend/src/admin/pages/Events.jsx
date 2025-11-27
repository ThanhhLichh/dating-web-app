import { useState, useEffect } from "react";
import adminApi from "../../services/adminApi"; 
import AdminLayout from "../layout/AdminLayout";
import toast from "react-hot-toast";
import { API_URL } from "../../config"; 
import { FaCalendarPlus, FaTrash, FaUsers, FaMapMarkerAlt, FaClock, FaEdit, FaTimes, FaImage } from "react-icons/fa";
import "./Admin.css"; 

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "", description: "", location: "", start_time: "", 
    limit: "", // 👈 Để trống ban đầu, không set cứng 50
    file: null
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/events/");
      setEvents(res.data);
    } catch (err) { toast.error("Lỗi tải sự kiện!"); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sự kiện này?")) return;
    try {
      await adminApi.delete(`/events/${id}`);
      toast.success("Đã xóa!");
      setEvents(prev => prev.filter((e) => e.event_id !== id));
    } catch { toast.error("Lỗi xóa!"); }
  };

  // --- KHI BẤM SỬA ---
  const handleEdit = (ev) => {
    setEditingId(ev.event_id);
    setShowForm(true);

    let formattedTime = "";
    if(ev.start_time) {
        try { formattedTime = new Date(ev.start_time).toISOString().slice(0, 16); } catch(e){}
    }

    setFormData({
        title: ev.title,
        description: ev.description,
        location: ev.location,
        start_time: formattedTime,
        limit: ev.max_participants, // 👈 LẤY ĐÚNG SỐ TỪ DATABASE
        file: null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ title: "", description: "", location: "", start_time: "", limit: "", file: null });
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !formData.file) return toast.error("Vui lòng chọn ảnh!");

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("location", formData.location);
    data.append("start_time", formData.start_time);
    data.append("limit", formData.limit); // 👈 Gửi số lượng chuẩn lên server
    if (formData.file) data.append("file", formData.file);

    const toastId = toast.loading(editingId ? "Đang cập nhật..." : "Đang tạo...");
    try {
      if (editingId) {
        await adminApi.put(`/events/${editingId}`, data, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Cập nhật thành công!", { id: toastId });
      } else {
        await adminApi.post("/events/", data, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Tạo thành công!", { id: toastId });
      }
      handleCancel();
      fetchEvents(); 
    } catch (err) { toast.error("Lỗi xử lý!", { id: toastId }); }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="admin-title">🎉 Quản lý Sự kiện</h1>
        <button className="btn-unban" onClick={() => { if (showForm) handleCancel(); else setShowForm(true); }} style={{ background: showForm ? "#6b7280" : "#10b981" }}>
          {showForm ? "Đóng Form" : "+ Thêm Sự Kiện"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: 25, borderRadius: 15, marginBottom: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: editingId ? "2px solid #ff4b7d" : "none" }}>
          <h3 style={{marginBottom: 15, color: editingId ? '#ff4b7d' : '#333', display:'flex', alignItems:'center', gap:10}}>
             {editingId ? <><FaEdit/> Cập nhật sự kiện</> : <><FaCalendarPlus/> Thông tin sự kiện mới</>}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
                <input className="search-box input" placeholder="Tên sự kiện" name="title" value={formData.title} onChange={handleInputChange} required style={{width: '100%'}} />
                <input className="search-box input" placeholder="Địa điểm" name="location" value={formData.location} onChange={handleInputChange} required style={{width: '100%'}} />
                
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <label style={{fontSize: 14, fontWeight: 600, color: '#555'}}>Giới hạn:</label>
                    <input type="number" min="1" name="limit" value={formData.limit} onChange={handleInputChange} required className="search-box input" style={{width: '100px'}} />
                    <span style={{fontSize: 14, color: '#888'}}>người</span>
                </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
                <input type="datetime-local" name="start_time" style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', width: '100%' }} value={formData.start_time} onChange={handleInputChange} required />
                <div style={{position:'relative'}}>
                    <input type="file" onChange={handleFileChange} accept="image/*" required={!editingId} style={{ padding: '10px 0', width:'100%' }} />
                    <span style={{position:'absolute', right:0, top:10, color:'#888'}}><FaImage/></span>
                </div>
            </div>

            <textarea placeholder="Mô tả..." name="description" rows="4" style={{ gridColumn: '1 / -1', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit', resize: 'vertical' }} value={formData.description} onChange={handleInputChange} required />

            <div style={{gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10}}>
                <button type="submit" className="btn-unban" style={{ padding: '12px 30px', fontSize: 16 }}>{editingId ? "Lưu Thay Đổi" : "Đăng Sự Kiện"}</button>
                {editingId && <button type="button" onClick={handleCancel} style={{ padding: '12px 20px', fontSize: 16, background: '#f3f4f6', color: '#333', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}><FaTimes /> Hủy</button>}
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Ảnh</th><th>Tên sự kiện</th><th>Thời gian</th><th>Địa điểm</th><th>Số lượng</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" style={{textAlign:'center', padding:20}}>Đang tải...</td></tr> : 
             events.map((ev) => (
              <tr key={ev.event_id}>
                <td>#{ev.event_id}</td>
                <td><img src={`${API_URL}${ev.image_url}`} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { e.target.src = "https://via.placeholder.com/60"; }} /></td>
                <td style={{ fontWeight: 'bold', color: '#333' }}>{ev.title}</td>
                <td style={{ fontSize: 13, color: '#555' }}><FaClock style={{marginRight:4, color:'#888'}}/> {new Date(ev.start_time).toLocaleString('vi-VN')}</td>
                <td style={{ fontSize: 13 }}><FaMapMarkerAlt style={{marginRight:4, color:'#888'}}/> {ev.location}</td>
                
                {/* 👇 HIỂN THỊ CHÍNH XÁC SỐ LƯỢNG TỪ DB, KHÔNG CÓ || 50 */}
                <td>
                    <span style={{background: '#e0f2fe', color: '#007bff', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 'bold'}}>
                        <FaUsers /> {ev.current_count} / {ev.max_participants}
                    </span>
                </td>
                
                <td>
                  <div style={{display: 'flex', gap: 8}}>
                      <button onClick={() => handleEdit(ev)} style={{padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer'}}><FaEdit /></button>
                      <button className="delete-btn" onClick={() => handleDelete(ev.event_id)}><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}