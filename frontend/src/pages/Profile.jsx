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
import { API_URL } from "../config";

// 🎨 Icon imports
import { FiEdit2, FiHeart, FiImage, FiPlusCircle } from "react-icons/fi";
import { FaCrown, FaTrashAlt, FaSave, FaTimesCircle, FaBirthdayCake, FaMapMarkerAlt } from "react-icons/fa";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [interests, setInterests] = useState([]);
  const [newAvatar, setNewAvatar] = useState(null);

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
              &nbsp;&nbsp;
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
        <div className="profile-section settings">
          <h3>
            <FiEdit2 /> Cài đặt tài khoản
          </h3>
          <button
            className="btn-logout"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}