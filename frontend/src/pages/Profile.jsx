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

// 🎨 Icon imports
import { FiEdit2, FiHeart, FiImage, FiPlusCircle, FiLock, FiLogOut, FiEyeOff } from "react-icons/fi";
import { FaCrown, FaTrashAlt, FaSave, FaTimesCircle, FaBirthdayCake, FaMapMarkerAlt, FaVenusMars  } from "react-icons/fa";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [interests, setInterests] = useState([]);
  const [newAvatar, setNewAvatar] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  // ==== SKIP LIST ====
const [showSkippedModal, setShowSkippedModal] = useState(false);
const [skippedUsers, setSkippedUsers] = useState([]);
const [detailUser, setDetailUser] = useState(null);
const [showDetailModal, setShowDetailModal] = useState(false);



  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setForm(data);
        setInterests(data.interests || []);
      } catch (err) {
        console.error("Lỗi tải hồ sơ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async () => {
    try {
      await updateProfile(form);
      if (newAvatar) await uploadAvatar(newAvatar);
      await new Promise((r) => setTimeout(r, 100));
      await updateInterests([...interests]);

      alert("✅ Cập nhật hồ sơ thành công!");
      const updated = await getProfile();
      setProfile(updated);
      setEditMode(false);
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      alert("❌ Cập nhật thất bại!");
    }
  };
  const handleChangePassword = async () => {
  if (!oldPassword || !newPassword) {
    alert("Vui lòng nhập đầy đủ thông tin!");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Mật khẩu mới không trùng khớp!");
    return;
  }

  try {
    setChanging(true);
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(`❌ ${data.detail}`);
      setChanging(false);
      return;
    }

    alert("✅ Đổi mật khẩu thành công!");
    setShowPasswordModal(false);

  } catch (err) {
    console.error(err);
    alert("Lỗi hệ thống!");
  } finally {
    setChanging(false);
  }
};

// Lấy danh sách người đã bỏ qua
const fetchSkippedUsers = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/home/skipped`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSkippedUsers(data);
  } catch (err) {
    console.error("Lỗi tải skip:", err);
  }
};

// Gỡ skip
const undoSkip = async (uid) => {
  try {
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/home/skipped/${uid}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchSkippedUsers(); 
  } catch (err) {
    console.error("Lỗi undo:", err);
  }
};

// Xem chi tiết user bị skip
const viewSkipDetail = async (uid) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/users/${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setDetailUser(data);
    setShowDetailModal(true);
  } catch (err) {
    console.error("Lỗi xem hồ sơ:", err);
  }
};




  if (loading) return <div className="loading">Đang tải hồ sơ...</div>;
  if (!profile)
    return <div className="error">Không thể tải thông tin người dùng</div>;

  return (
    <>
      <Navbar />

      <div className="profile-container">
        {/* ==== HEADER ==== */}
        <div className="profile-header">
          <div className="avatar-wrapper">
            <img
              src={`${API_URL}${
                profile.photos.find((p) => p.is_avatar)?.url ||
                "/default-avatar.png"
              }`}
              alt="Avatar"
              className="avatar"
            />

            {/* Hover edit icon */}
            <div className="avatar-edit-overlay">
              <label htmlFor="avatar-upload" className="edit-icon">
                <FiEdit2 />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);

                    try {
                      // ✅ FIX: Dùng template literal với backticks
                      await fetch(`${API_URL}/users/me/avatar`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                        body: formData,
                      });
                      const updated = await getProfile();
                      setProfile(updated);
                    } catch (err) {
                      console.error("Lỗi upload avatar:", err);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="info">
            <h2>{profile.full_name}</h2>
            <p>
  <FaBirthdayCake style={{ marginRight: "6px", color: "#ff4b2b" }} />
  {profile.birthday ? (
    <>
      {new Date(profile.birthday).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })}{" "}
      ({new Date().getFullYear() - new Date(profile.birthday).getFullYear()} tuổi)
    </>
  ) : (
    "Chưa rõ"
  )}

  &nbsp;•&nbsp;

  <FaVenusMars style={{ marginRight: "6px", color: "#ff66a3" }} />
  {profile.gender || "Không rõ"}

  &nbsp;•&nbsp;

  <FaMapMarkerAlt style={{ marginRight: "4px", color: "#ff7b66" }} />
  {profile.city || "Chưa cập nhật"}
</p>


            <span className="status online">Đang hoạt động</span>
            <p className="bio">{profile.bio || "Chưa có mô tả bản thân"}</p>
          </div>

          <button className="btn-edit" onClick={() => setEditMode(true)}>
            <FiEdit2 /> Chỉnh sửa hồ sơ
          </button>
        </div>

        {/* ==== MODAL CHỈNH SỬA ==== */}
        {editMode && (
          <div className="edit-modal">
            <h3>
              <FiEdit2 /> Cập nhật thông tin cá nhân
            </h3>

            <input
              value={form.full_name || ""}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Họ và tên"
            />

            <input
              value={form.city || ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Thành phố"
            />

            <select
              value={form.gender || ""}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>

            <input
              value={form.job || ""}
              onChange={(e) => setForm({ ...form, job: e.target.value })}
              placeholder="Nghề nghiệp"
            />

            <input
              type="number"
              value={form.height || ""}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              placeholder="Chiều cao (cm)"
            />

            <textarea
              value={form.bio || ""}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Giới thiệu bản thân"
            />

            <div className="interests-edit">
              <h4>Chọn hoặc nhập sở thích của bạn</h4>
              <div className="preset-interests">
                {["Âm nhạc", "Du lịch", "Game", "Thể thao", "Cà phê", "Phim ảnh"].map(
                  (i) => (
                    <span
                      key={i}
                      className={interests.includes(i) ? "active" : ""}
                      onClick={() =>
                        setInterests((prev) =>
                          prev.includes(i)
                            ? prev.filter((x) => x !== i)
                            : [...prev, i]
                        )
                      }
                    >
                      {i}
                    </span>
                  )
                )}
              </div>

              <input
                type="text"
                placeholder="Nhập thêm sở thích mới rồi nhấn Enter..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = e.target.value.trim();
                    if (value && !interests.includes(value)) {
                      setInterests((prev) => [...prev, value]);
                      e.target.value = "";
                    }
                  }
                }}
              />

              <div className="selected-interests">
                {interests.map((i, idx) => (
                  <span key={idx} className="active">
                    {i}
                    <button
                      className="remove-interest"
                      onClick={() =>
                        setInterests(interests.filter((x) => x !== i))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handleSubmit}>
                <FaSave /> Lưu
              </button>
              <button onClick={() => setEditMode(false)}>
                <FaTimesCircle /> Hủy
              </button>
            </div>
          </div>
        )}

        {showPasswordModal && (
  <div className="password-modal">
    <div className="password-modal-content">
      <h3>🔐 Đổi mật khẩu</h3>

      <input
        type="password"
        placeholder="Mật khẩu hiện tại"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Mật khẩu mới"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Xác nhận mật khẩu mới"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <div className="password-modal-actions">
        <button
          className="save-btn"
          disabled={changing}
          onClick={handleChangePassword}
        >
          {changing ? "Đang xử lý..." : "Lưu"}
        </button>

        <button
          className="cancel-btn"
          onClick={() => setShowPasswordModal(false)}
        >
          Hủy
        </button>
      </div>
    </div>
  </div>
)}

{showSkippedModal && (
  <div className="password-modal">
    <div className="password-modal-content">

      <h3>👁‍🗨 Danh sách người đã bỏ qua</h3>

      {skippedUsers.length === 0 && (
        <p style={{ textAlign: "center", opacity: 0.6 }}>
          Không có ai trong danh sách.
        </p>
      )}

      {skippedUsers.map((u) => (
        <div key={u.user_id} className="skipped-item">

          <img
            src={`${API_URL}${u.avatar || "/default-avatar.png"}`}
            className="skipped-avatar"
          />

          <div className="skipped-info">
            <h4>{u.full_name}</h4>
          </div>

          <div className="skipped-actions">
            <button className="view-btn" onClick={() => viewSkipDetail(u.user_id)}>
              Xem
            </button>

            <button className="undo-btn" onClick={() => undoSkip(u.user_id)}>
              Hoàn tác
            </button>
          </div>
        </div>
      ))}

      <button className="cancel-btn" onClick={() => setShowSkippedModal(false)}>
        Đóng
      </button>

    </div>
  </div>
)}

{showDetailModal && detailUser && (
  <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      
      <button className="close-btn" onClick={() => setShowDetailModal(false)}>
        <FaTimesCircle />
      </button>

      <h2 className="modal-title">Hồ sơ chi tiết</h2>

      {/* Avatar */}
      <img
        src={`${API_URL}${
          detailUser.photos?.find((p) => p.is_avatar)?.url ||
          "/default-avatar.png"
        }`}
        alt="Avatar"
        className="modal-avatar"
      />

      {/* Tên */}
      <h2>{detailUser.full_name}</h2>

      {/* Info */}
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


      {/* Bio */}
      <p className="modal-bio">{detailUser.bio || "Chưa có giới thiệu bản thân"}</p>

      {/* Interests */}
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

      {/* Photos gallery */}
      {detailUser.photos?.length > 1 && (
        <div className="modal-photos">
          <h4>Bộ sưu tập ảnh</h4>
          <div className="photo-grid">
            {detailUser.photos
              .filter((p) => !p.is_avatar)
              .map((p) => (
                <img
                  key={p.photo_id}
                  src={`${API_URL}${p.url}`}
                  alt="photo"
                  className="modal-photo"
                />
              ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}





        {/* ==== THÔNG TIN CƠ BẢN ==== */}
        <div className="profile-section">
          <h3>Thông tin cơ bản</h3>
          <div className="grid">
            <div>
              <strong>Giới tính:</strong> {profile.gender}
            </div>
            <div>
              <strong>Nghề nghiệp:</strong> {profile.job || "—"}
            </div>
            <div>
              <strong>Chiều cao:</strong>{" "}
              {profile.height ? `${profile.height} cm` : "—"}
            </div>
          </div>
        </div>

        {/* ==== SỞ THÍCH ==== */}
        <div className="profile-section">
          <h3>
            <FiHeart /> Sở thích
          </h3>
          <div className="interests">
            {profile.interests.length > 0 ? (
              profile.interests.map((i, idx) => <span key={idx}>{i}</span>)
            ) : (
              <p>Chưa cập nhật sở thích</p>
            )}
          </div>
        </div>

        {/* ==== ẢNH ==== */}
        <div className="profile-section">
          <h3>
            <FiImage /> Bộ sưu tập ảnh
          </h3>

          <div className="photos-grid">
            {/* Nút thêm ảnh */}
            <label className="add-photo">
              <FiPlusCircle />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("file", file);

                  try {
                    // ✅ FIX: Dùng template literal với backticks
                    await fetch(`${API_URL}/photos/me`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                          "token"
                        )}`,
                      },
                      body: formData,
                    });

                    const updated = await getProfile();
                    setProfile(updated);
                  } catch (err) {
                    console.error("Lỗi upload ảnh:", err);
                  }
                }}
              />
            </label>

            {/* Hiển thị ảnh */}
            {profile.photos.length > 0 ? (
              profile.photos.map((p) => (
                <div key={p.photo_id} className="photo-item">
                  <img
                    src={`${API_URL}${p.url}`}
                    alt="photo"
                    className="photo"
                  />

                  <div className="photo-overlay">
                    {!p.is_avatar && (
                      <button
                        onClick={async () => {
                          // ✅ FIX: Dùng template literal với backticks
                          await fetch(
                            `${API_URL}/photos/me/${p.photo_id}/set_avatar`,
                            {
                              method: "PUT",
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem(
                                  "token"
                                )}`,
                              },
                            }
                          );
                          const updated = await getProfile();
                          setProfile(updated);
                        }}
                      >
                        <FaCrown /> Đặt làm avatar
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (window.confirm("Xóa ảnh này?")) {
                          // ✅ FIX: Dùng template literal với backticks
                          await fetch(
                            `${API_URL}/photos/me/${p.photo_id}`,
                            {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem(
                                  "token"
                                )}`,
                              },
                            }
                          );
                          const updated = await getProfile();
                          setProfile(updated);
                        }
                      }}
                    >
                      <FaTrashAlt /> Xóa
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>Chưa có ảnh nào</p>
            )}
          </div>
        </div>



        {/* ==== CÀI ĐẶT ==== */}
        {/* ==== CÀI ĐẶT ==== */}
<div className="profile-section settings">
  <h3>
    <FiEdit2 /> Cài đặt tài khoản
  </h3>

  {/* ⭐ Nhóm nút */}
  <div className="settings-actions">
    <button
  className="btn-change-password"
  onClick={() => setShowPasswordModal(true)}
>
  <FiLock /> Đổi mật khẩu
</button>

  <button
    className="btn-change-password"
    onClick={() => {
      fetchSkippedUsers();
      setShowSkippedModal(true);
    }}
  >
    <FiEyeOff /> Người đã bỏ qua
  </button>
    <button
  className="btn-logout"
  onClick={() => {
    localStorage.removeItem("token");
    window.location.href = "/";
  }}
>
  <FiLogOut /> Đăng xuất
</button>

  </div>
</div>

      </div>

      <Footer />
    </>
  );
}