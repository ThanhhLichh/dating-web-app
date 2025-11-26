import { useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  updateInterests,
} from "../services/userService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Profile.css";
import "./Home.css";
import { API_URL } from "../config";
import toast, { Toaster } from "react-hot-toast"; 

// 🎨 Icon imports
import { FiEdit2, FiHeart, FiImage, FiPlusCircle, FiLock, FiLogOut, FiEyeOff, FiUser } from "react-icons/fi";
import { FaCrown, FaTrashAlt, FaBirthdayCake, FaMapMarkerAlt, FaVenusMars, FaRegSadTear } from "react-icons/fa";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [interests, setInterests] = useState([]);
  
  // Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Skip List State
  const [showSkippedModal, setShowSkippedModal] = useState(false);
  const [skippedUsers, setSkippedUsers] = useState([]);
  const [detailUser, setDetailUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setForm(data);
      setInterests(data.interests || []);
    } catch (err) {
      toast.error("Không thể tải hồ sơ!");
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 500); 
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Đang cập nhật hồ sơ...");
    try {
      await updateProfile(form);
      await updateInterests([...interests]);
      
      toast.success("Cập nhật thành công!", { id: toastId });
      const updated = await getProfile();
      setProfile(updated);
      setEditMode(false);
    } catch (err) {
      toast.error("Cập nhật thất bại!", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return toast.error("Vui lòng nhập đủ thông tin!");
    if (newPassword !== confirmPassword) return toast.error("Mật khẩu xác nhận không khớp!");

    setIsSaving(true);
    const toastId = toast.loading("Đang đổi mật khẩu...");
    
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      toast.success("Đổi mật khẩu thành công!", { id: toastId });
      setShowPasswordModal(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Lỗi hệ thống", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // --- LOGIC SKIP LIST ---
  const fetchSkippedUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/home/skipped`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await res.json();
      setSkippedUsers(data);
      setShowSkippedModal(true);
    } catch (err) { toast.error("Lỗi tải danh sách"); }
  };

  const undoSkip = async (uid) => {
    try {
      await fetch(`${API_URL}/home/skipped/${uid}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      toast.success("Đã gỡ bỏ qua");
      setSkippedUsers(skippedUsers.filter(u => u.user_id !== uid));
    } catch (err) { toast.error("Lỗi hoàn tác"); }
  };

  const viewSkipDetail = async (uid) => {
    try {
      const res = await fetch(`${API_URL}/users/${uid}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await res.json();
      setDetailUser(data);
      setShowDetailModal(true);
    } catch (err) { toast.error("Không xem được chi tiết"); }
  };

  // --- SKELETON LOADING UI ---
  if (loading) return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <div className="skeleton sk-avatar"></div>
          <div className="info" style={{width: '100%', marginLeft: 30}}>
             <div className="skeleton sk-title"></div>
             <div className="skeleton sk-line" style={{width:'40%'}}></div>
             <div className="skeleton sk-line" style={{width:'80%', marginTop:'20px', height:'60px'}}></div>
          </div>
        </div>
        <div className="profile-content-grid">
           <div className="skeleton sk-block"></div>
           <div className="skeleton sk-block" style={{height: 400}}></div>
        </div>
      </div>
      <Footer />
    </>
  );

  if (!profile) return <div style={{textAlign:'center', marginTop:50}}>Không tìm thấy dữ liệu</div>;

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff', borderRadius: '10px' }}} />
      <Navbar />

      <div className="profile-container">
        
        {/* ==== PROFILE HEADER ==== */}
        <div className="profile-header">
          <div className="avatar-wrapper">
            <img
              src={`${API_URL}${profile.photos.find((p) => p.is_avatar)?.url || "/default-avatar.png"}`}
              alt="Avatar"
              className="avatar"
            />
            <label className="avatar-edit-overlay">
              <FiEdit2 />
              <input type="file" hidden accept="image/*" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const toastId = toast.loading("Đang cập nhật avatar...");
                  const formData = new FormData();
                  formData.append("file", file);
                  try {
                    await fetch(`${API_URL}/users/me/avatar`, {
                      method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                      body: formData,
                    });
                    toast.success("Đổi avatar thành công!", { id: toastId });
                    fetchProfileData();
                  } catch (err) { toast.error("Lỗi upload avatar", { id: toastId }); }
                }}
              />
            </label>
          </div>

          <div className="info">
            <h2>{profile.full_name}</h2>
            <div className="meta-info">
              <span className="meta-item"><FaBirthdayCake className="icon-orange" /> {profile.birthday ? new Date(profile.birthday).toLocaleDateString("vi-VN") : "N/A"}</span>
              <span className="meta-item"><FaVenusMars className="icon-pink" /> {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}</span>
              <span className="meta-item"><FaMapMarkerAlt className="icon-red" /> {profile.city || "Chưa cập nhật"}</span>
            </div>
            <span className="status online">● Đang hoạt động</span>
            <div><p className="bio">{profile.bio || "Người dùng này chưa viết gì về bản thân..."}</p></div>
          </div>

          <button className="btn-edit" onClick={() => setEditMode(true)}>
            <FiEdit2 /> Sửa hồ sơ
          </button>
        </div>

        {/* ==== GRID LAYOUT ==== */}
        <div className="profile-content-grid">

          {/* ==== CỘT TRÁI: GỘP THÔNG TIN & SỞ THÍCH ==== */}
          <div className="profile-left-column">
             
             <div className="profile-section">
                {/* Phần 1: Thông tin cơ bản */}
                <h3><FiUser /> Thông tin & Sở thích</h3>
                <div className="grid-info">
                   <div className="grid-item"><strong>Giới tính</strong><span>{profile.gender === 'male' ? 'Nam' : 'Nữ'}</span></div>
                   <div className="grid-item"><strong>Nghề nghiệp</strong><span>{profile.job || "Chưa có"}</span></div>
                   <div className="grid-item"><strong>Chiều cao</strong><span>{profile.height ? `${profile.height} cm` : "Chưa có"}</span></div>
                </div>

                {/* Đường kẻ ngăn cách */}
                <hr className="section-divider" />

                {/* Phần 2: Sở thích */}
                <h4 style={{marginBottom: 15, display:'flex', alignItems:'center', gap:8}}><FiHeart style={{color:'var(--primary)'}}/> Sở thích cá nhân</h4>
                <div className="interests">
                  {profile.interests.length > 0 ? profile.interests.map((i, idx) => <span key={idx} className="tag">{i}</span>) 
                  : <span style={{color:'#999', fontStyle:'italic'}}>Chưa thêm sở thích nào</span>}
                </div>
             </div>
             
          </div>

          {/* ==== CỘT PHẢI: ẢNH ==== */}
          <div className="profile-right-column">
             <div className="profile-section">
                <h3><FiImage /> Bộ sưu tập ảnh ({profile.photos.length})</h3>
                <div className="photos-grid">
                  
                  <label className="add-photo">
                    <FiPlusCircle size={30} /> <span>Thêm ảnh</span>
                    <input type="file" hidden accept="image/*" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const tId = toast.loading("Đang tải ảnh lên...");
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          await fetch(`${API_URL}/photos/me`, {
                            method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                            body: formData,
                          });
                          toast.success("Thêm ảnh thành công!", { id: tId });
                          fetchProfileData();
                        } catch (err) { toast.error("Lỗi upload", { id: tId }); }
                      }} 
                    />
                  </label>

                  {profile.photos.length === 0 && (
                    <div style={{gridColumn: '1/-1', textAlign:'center', color:'#999', padding:20}}>
                       <FaRegSadTear style={{fontSize: 30, marginBottom: 10, display:'block', margin:'0 auto 10px'}}/> 
                       Chưa có ảnh nào.
                    </div>
                  )}

                  {profile.photos.map((p) => (
                    <div key={p.photo_id} className="photo-item">
                      <img src={`${API_URL}${p.url}`} alt="photo" />
                      <div className="photo-overlay">
                        {!p.is_avatar && (
                          <button className="photo-btn" onClick={async () => {
                              toast.promise(
                                fetch(`${API_URL}/photos/me/${p.photo_id}/set_avatar`, {
                                  method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                                }).then(() => fetchProfileData()),
                                { loading: 'Đang xử lý...', success: 'Đã đặt làm Avatar', error: 'Lỗi' }
                              );
                            }}>
                            <FaCrown className="icon-orange" /> Avatar
                          </button>
                        )}
                        <button className="photo-btn" onClick={async () => {
                            if(!confirm("Xóa ảnh này?")) return;
                            try {
                              await fetch(`${API_URL}/photos/me/${p.photo_id}`, {
                                method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                              });
                              toast.success("Đã xóa ảnh");
                              fetchProfileData();
                            } catch(e) { toast.error("Lỗi xóa ảnh"); }
                          }}>
                          <FaTrashAlt className="icon-red" /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* ==== SETTINGS ==== */}
        <div className="profile-section settings-container">
           <h3><FiLock /> Cài đặt & Riêng tư</h3>
           <div className="settings-actions">
              <button className="btn-setting" onClick={() => setShowPasswordModal(true)}><FiLock /> Đổi mật khẩu</button>
              <button className="btn-setting" onClick={fetchSkippedUsers}><FiEyeOff /> Danh sách chặn/Bỏ qua</button>
              <button className="btn-setting btn-logout" onClick={() => { localStorage.removeItem("token"); window.location.href="/"; }}><FiLogOut /> Đăng xuất</button>
           </div>
        </div>

        {/* ==== MODALS ==== */}
        {editMode && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Chỉnh sửa hồ sơ</h3>
              <div className="form-group"><input className="form-input" placeholder="Họ tên" value={form.full_name || ""} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
              <div className="form-group" style={{display:'flex', gap:10}}>
                <input className="form-input" placeholder="Thành phố" value={form.city || ""} onChange={e => setForm({...form, city: e.target.value})} />
                <select className="form-select" value={form.gender || ""} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option>
                </select>
              </div>
              <div className="form-group" style={{display:'flex', gap:10}}>
                 <input className="form-input" placeholder="Nghề nghiệp" value={form.job || ""} onChange={e => setForm({...form, job: e.target.value})} />
                 <input className="form-input" type="number" placeholder="Chiều cao (cm)" value={form.height || ""} onChange={e => setForm({...form, height: e.target.value})} />
              </div>
              <textarea className="form-textarea" rows="3" placeholder="Giới thiệu..." value={form.bio || ""} onChange={e => setForm({...form, bio: e.target.value})}></textarea>
              
              <div className="interests-edit">
                 <h4>Sở thích</h4>
                 <div className="preset-tags">
                    {["Âm nhạc", "Du lịch", "Game", "Thể thao", "Nấu ăn", "Đọc sách", "Cà phê"].map(tag => (
                      <span key={tag} className={interests.includes(tag) ? "active" : ""} 
                            onClick={() => setInterests(prev => prev.includes(tag) ? prev.filter(i=>i!==tag) : [...prev, tag])}>
                        {tag}
                      </span>
                    ))}
                 </div>
                 <input className="form-input" placeholder="Thêm sở thích khác (Enter)..." style={{marginTop: 10}}
                        onKeyDown={e => { if(e.key==="Enter" && e.target.value.trim()){ 
                          if(!interests.includes(e.target.value.trim())) setInterests([...interests, e.target.value.trim()]); 
                          e.target.value=""; 
                        }}} 
                 />
                 <div className="selected-tags-area">
                    {interests.map((tag, idx) => (
                      <div key={idx} className="selected-tag">{tag} <button className="remove-tag" onClick={() => setInterests(interests.filter(i=>i!==tag))}>×</button></div>
                    ))}
                 </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setEditMode(false)}>Hủy</button>
                <button className="btn-confirm" disabled={isSaving} onClick={handleUpdateProfile}>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</button>
              </div>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Đổi mật khẩu</h3>
              <input className="form-input" type="password" placeholder="Mật khẩu cũ" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
              <input className="form-input" type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <input className="form-input" type="password" placeholder="Xác nhận mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowPasswordModal(false)}>Hủy</button>
                <button className="btn-confirm" disabled={isSaving} onClick={handleChangePassword}>{isSaving ? "Đang xử lý..." : "Xác nhận"}</button>
              </div>
            </div>
          </div>
        )}

        {showSkippedModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Danh sách bỏ qua</h3>
              {skippedUsers.length === 0 ? <p style={{textAlign:'center', color:'#999'}}>Danh sách trống</p> : (
                <div style={{maxHeight: '300px', overflowY:'auto'}}>
                  {skippedUsers.map(u => (
                    <div key={u.user_id} className="skipped-item">
                       <img src={`${API_URL}${u.avatar || "/default-avatar.png"}`} className="skipped-avatar" />
                       <strong>{u.full_name}</strong>
                       <div className="skipped-actions">
                          <button className="btn-xs btn-blue" onClick={() => viewSkipDetail(u.user_id)}>Xem</button>
                          <button className="btn-xs btn-red" onClick={() => undoSkip(u.user_id)}>Gỡ</button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="modal-actions"><button className="btn-cancel" onClick={() => setShowSkippedModal(false)}>Đóng</button></div>
            </div>
          </div>
        )}

        {showDetailModal && detailUser && (
           <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
              <div className="modal-box" onClick={e => e.stopPropagation()}>
                 <div style={{textAlign:'center'}}>
                    <img src={`${API_URL}${detailUser.photos?.find(p=>p.is_avatar)?.url || "/default-avatar.png"}`} style={{width:100, height:100, borderRadius:'50%', objectFit:'cover', border:'3px solid #ff4b7d'}} />
                    <h2 style={{margin:'10px 0'}}>{detailUser.full_name}</h2>
                    <p>{detailUser.bio}</p>
                 </div>
                 <div className="photos-grid" style={{marginTop:20}}>
                    {detailUser.photos?.filter(p=>!p.is_avatar).map(p => <img key={p.photo_id} src={`${API_URL}${p.url}`} style={{width:'100%', borderRadius:10}} />)}
                 </div>
                 <div className="modal-actions"><button className="btn-cancel" onClick={() => setShowDetailModal(false)}>Đóng</button></div>
              </div>
           </div>
        )}
      </div>
      <Footer />
    </>
  );
}