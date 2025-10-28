import { useEffect, useState } from "react";
import { getRecommendation, likeUser, skipUser } from "../services/homeService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Home.css";
import {
  FaHeart,
  FaTimesCircle,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaVenusMars,
} from "react-icons/fa";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [total, setTotal] = useState(0);
  const [index, setIndex] = useState(0);

  // ✅ State lưu bộ lọc
  const [filters, setFilters] = useState({
    gender: "",
    min_age: 18,
    max_age: 60,
    city: "",
    interest: "",
  });

  const profile = JSON.parse(localStorage.getItem("user"));
  const userName = profile?.full_name?.split(" ")[0] || "bạn";

  // ✅ Lấy gợi ý người dùng
  const fetchUser = async (appliedFilters = filters) => {
    try {
      setLoading(true);
      const data = await getRecommendation(appliedFilters);
      setUser(data.user);
      setTotal(data.total);
      setIndex(data.index);
      setError("");
    } catch {
      setUser(null);
      setError("Không còn người nào để gợi ý 💔");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // ✅ Thay đổi filter
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleApplyFilter = () => {
    fetchUser(filters);
  };

  const handleLike = async () => {
    if (!user) return;
    await likeUser(user.user_id);
    fetchUser(filters);
  };

  const handleSkip = async () => {
    if (!user) return;
    await skipUser(user.user_id);
    fetchUser(filters);
  };

  return (
    <>
      <Navbar />
      

      <div className="home-page">
        {/* 💖 Header lời chào có nền riêng */}
        <header className="hero-section">
          <div className="hero-content">
            <h1>
              Chào mừng <span>{userName}</span> đến với{" "}
              <strong>LoveConnect</strong> 💞
            </h1>
            <p>
              Nơi những trái tim đồng điệu gặp nhau. Kết nối với những người
              phù hợp, tạo nên câu chuyện tình yêu ý nghĩa của riêng bạn.
            </p>
            <div className="hero-buttons">
              <button className="btn-start" onClick={() => fetchUser()}>
                Bắt đầu tìm kiếm
              </button>
              <button className="btn-learn">Tìm hiểu thêm</button>
            </div>
          </div>
        </header>

        <div className="main-content">
          {/* 🌸 Bộ lọc tìm kiếm */}
          <aside className="filter-panel">
            <h3>🔍 Bộ lọc tìm kiếm</h3>

            <label>Độ tuổi</label>
            <div className="age-filter">
              <input
                type="number"
                name="min_age"
                value={filters.min_age}
                min="18"
                max="60"
                onChange={handleFilterChange}
              />
              <span> - </span>
              <input
                type="number"
                name="max_age"
                value={filters.max_age}
                min="18"
                max="60"
                onChange={handleFilterChange}
              />
            </div>

            <label>Giới tính</label>
            <select name="gender" value={filters.gender} onChange={handleFilterChange}>
              <option value="">Tất cả</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>

            <label>Vị trí</label>
            <input
              type="text"
              name="city"
              value={filters.city}
              placeholder="Thành phố..."
              onChange={handleFilterChange}
            />

            <label>Sở thích</label>
            <input
              type="text"
              name="interest"
              value={filters.interest}
              placeholder="Nhập sở thích..."
              onChange={handleFilterChange}
            />

            <button className="btn-apply" onClick={handleApplyFilter}>
              Áp dụng bộ lọc
            </button>
          </aside>

          {/* 💞 Gợi ý người dùng */}
          <section className="recommend-section">
            <div className="recommend-header">
              <h3>Gợi ý cho bạn</h3>
              {total > 0 && (
                <span className="user-counter">
                  {index}/{total}
                </span>
              )}
            </div>

            {loading ? (
              <p>Đang tải...</p>
            ) : user ? (
              <div className="user-card">
                <img
                  src={`http://127.0.0.1:8000${
                    user.avatar_url || "/default-avatar.png"
                  }`}
                  alt="avatar"
                  className="user-photo"
                />

                <div className="user-info">
                  <h2>
                    {user.full_name}{" "}
                    <span className="age">
                      {user.age ? `${user.age} tuổi` : ""}
                    </span>
                  </h2>
                  <p className="bio">{user.bio || "Chưa có mô tả bản thân"}</p>
                  <p className="location">
                    <FaMapMarkerAlt /> {user.city || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="actions">
                  <button className="btn-skip" onClick={handleSkip}>
                    <FaTimesCircle /> Bỏ qua
                  </button>
                  <button
                    className="btn-detail"
                    onClick={() => setShowDetail(true)}
                  >
                    <FaInfoCircle /> Xem chi tiết
                  </button>
                  <button className="btn-like" onClick={handleLike}>
                    <FaHeart /> Thích
                  </button>
                </div>
              </div>
            ) : (
              <p className="no-more">{error}</p>
            )}
          </section>
        </div>
      </div>

      {/* 💌 Modal chi tiết */}
      {showDetail && user && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowDetail(false)}>
              ✕
            </button>

            <img
              src={`http://127.0.0.1:8000${
                user.avatar_url || "/default-avatar.png"
              }`}
              alt="avatar"
              className="modal-avatar"
            />

            <h2>{user.full_name}</h2>
            <p className="modal-sub">
              <FaBirthdayCake /> {user.birthday?.slice(0, 10) || "Chưa rõ"}{" "}
              &nbsp;•&nbsp;
              <FaVenusMars /> {user.gender} &nbsp;•&nbsp;
              <FaMapMarkerAlt /> {user.city || "Chưa cập nhật"}
            </p>

            <p className="modal-bio">
              {user.bio || "Chưa có giới thiệu bản thân"}
            </p>

            {user.interests?.length > 0 && (
              <div className="modal-interests">
                <h4>Sở thích</h4>
                <div className="interests-list">
                  {user.interests.map((i, idx) => (
                    <span key={idx}>{i}</span>
                  ))}
                </div>
              </div>
            )}

            {user.photos?.length > 0 && (
              <div className="modal-photos">
                <h4>Bộ sưu tập ảnh</h4>
                <div className="photo-grid">
                  {user.photos.map((p) => (
                    <img
                      key={p.photo_id}
                      src={`http://127.0.0.1:8000${p.url}`}
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

      <Footer />
    </>
  );
}
