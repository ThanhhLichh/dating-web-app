import { useEffect, useState } from "react";
import { getRecommendation, likeUser, skipUser } from "../services/homeService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Home.css";
import { getProfileById } from "../services/userService";
import { API_URL } from "../config";

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
  const [detailUser, setDetailUser] = useState(null);
  const [total, setTotal] = useState(0);
  const [index, setIndex] = useState(0);

  const [filters, setFilters] = useState({
    gender: "",
    min_age: 18,
    max_age: 60,
    city: "",
    interest: "",
  });

  const profile = JSON.parse(localStorage.getItem("user"));
  const userName = profile?.full_name?.split(" ")[0] || "bạn";

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

  const handleViewDetail = async () => {
    try {
      const data = await getProfileById(user.user_id);
      setDetailUser(data);
      setShowDetail(true);
    } catch {
      alert("Không thể tải hồ sơ chi tiết!");
    }
  };

  return (
    <>
      <Navbar />
      <div className="home-page">
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
              {/* <button className="btn-learn">Tìm hiểu thêm</button> */}
            </div>
          </div>
        </header>

        <div className="main-content">
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
            <select
              name="gender"
              value={filters.gender}
              onChange={handleFilterChange}
            >
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
                  src={`${API_URL}${
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
                  <button className="btn-detail" onClick={handleViewDetail}>
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
      {showDetail && detailUser && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowDetail(false)}>
              ✕
            </button>

            <h2 className="modal-title">Hồ sơ chi tiết</h2>

            <img
              src={`${API_URL}${
                detailUser.photos?.find((p) => p.is_avatar)?.url ||
                "/default-avatar.png"
              }`}
              alt="avatar"
              className="modal-avatar"
            />

            <h2>{detailUser.full_name}</h2>
            <p className="modal-sub">
              <FaBirthdayCake />{" "}
              {detailUser.birthday?.slice(0, 10) || "Chưa rõ"} &nbsp;•&nbsp;
              <FaVenusMars /> {detailUser.gender || "Không rõ"} &nbsp;•&nbsp;
              <FaMapMarkerAlt /> {detailUser.city || "Chưa cập nhật"}
            </p>

            <p className="modal-bio">
              {detailUser.bio || "Chưa có giới thiệu bản thân"}
            </p>

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

      <Footer />
    </>
  );
}
