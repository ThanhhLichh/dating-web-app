import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { login, register } from "../services/authService";
import "./Auth.css";
import logo from "../assets/logo.svg";
import img1 from "../assets/sig4.webp";
import img2 from "../assets/sig2.webp";
import img3 from "../assets/sig1.webp";




export default function AuthLanding() {
  const [isLogin, setIsLogin] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    gender: "male",
    birthday: "",
  });
  const navigate = useNavigate();


const images = [img1, img2, img3];
const [current, setCurrent] = useState(0);
const [isAnimating, setIsAnimating] = useState(false);
const [direction, setDirection] = useState("next");

useEffect(() => {
  const interval = setInterval(() => {
    handleNext();
  }, 5000); // 5s đổi ảnh
  return () => clearInterval(interval);
}, []);

const handleNext = () => {
  if (isAnimating) return;
  setDirection("next");
  setIsAnimating(true);
  setCurrent((prev) => (prev + 1) % images.length);
  setTimeout(() => setIsAnimating(false), 900);
};

const handlePrev = () => {
  if (isAnimating) return;
  setDirection("prev");
  setIsAnimating(true);
  setCurrent((prev) => (prev - 1 + images.length) % images.length);
  setTimeout(() => setIsAnimating(false), 900);
};




    useEffect(() => {
  const container = document.querySelector(".heart-container");
  if (!container) return;

  const createHeart = () => {
    // Tạo 2–3 trái tim mỗi lần cho dày hơn
    const count = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < count; i++) {
      const heart = document.createElement("span");
      heart.className = "floating-heart";
      heart.innerText = "❤️";

      // Chỉ xuất hiện ở 2 rìa ảnh (0–20% hoặc 80–100%)
      const side = Math.random() < 0.5 ? "left" : "right";
      const offset = side === "left"
        ? Math.random() * 15 // trái
        : 85 + Math.random() * 10; // phải
      heart.style.left = `${offset}%`;

      // Ngẫu nhiên kích thước và độ trong
      heart.style.fontSize = `${14 + Math.random() * 18}px`;
      heart.style.opacity = `${0.6 + Math.random() * 0.4}`;

      container.appendChild(heart);

      // Xóa sau 7s
      setTimeout(() => heart.remove(), 7000);
    }
  };

  // Tạo nhanh hơn: mỗi 250ms
  const interval = setInterval(createHeart, 650);
  return () => clearInterval(interval);
}, []);



  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (isLogin) {
      const res = await login({ email: form.email, password: form.password });
      
      // ✅ Sửa tại đây — backend trả về access_token chứ không phải token
      if (res?.access_token) {
        localStorage.setItem("token", res.access_token); // Lưu token
        alert("Đăng nhập thành công!");
        navigate("/home"); // Điều hướng sang trang Home
      } else {
        alert("Không nhận được token từ server!");
      }

    } else {
      await register(form);
      alert("Đăng ký thành công! Hãy đăng nhập.");
      setIsLogin(true);
    }

    setShowModal(false);
  } catch (err) {
    console.error(err);
    alert("Có lỗi xảy ra!");
  }
};


  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <img src={logo} alt="LoveConnect logo" />
            <span>LoveConnect</span>
          </div>

          <div className="nav-links">
            <a href="#">Blog</a>
            <a href="#">Liên hệ</a>
            <a href="#">Về chúng tôi</a>
          </div>
        </div>

        <div className="topbar-right">
          <button
            className="btn-outline"
            onClick={() => {
              setIsLogin(true);
              setShowModal(true);
            }}
          >
            Đăng nhập
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setIsLogin(false);
              setShowModal(true);
            }}
          >
            Đăng ký
          </button>
        </div>
      </nav>

      {/* ===== LANDING SECTION ===== */}
      <div className="landing-wrapper">
        {/* LEFT */}
        <div className="left">
          <h1>
            Kết nối <span>mọi giới tính</span>,
          </h1>
          <h1>
            <span>mọi lứa tuổi</span> – không giới hạn.
          </h1>
          <p>
            LoveConnect giúp bạn tìm người thật sự phù hợp.  
            Trò chuyện, chia sẻ và bắt đầu hành trình cảm xúc của riêng bạn ❤️
          </p>

          <div className="btn-group">
            <button
              className="btn-primary"
              onClick={() => {
                setIsLogin(true);
                setShowModal(true);
              }}
            >
              Bắt đầu ngay
            </button>
            <button
              className="btn-outline"
              onClick={() => {
                setIsLogin(false);
                setShowModal(true);
              }}
            >
              Tạo tài khoản
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
  <div className="slider">
    {images.map((img, index) => (
  <img
    key={index}
    src={img}
    alt={`slide-${index}`}
    className={`slide-image ${index === current ? `active ${direction}` : ""}`}
  />
))}


    <button className="arrow left" onClick={handlePrev}>‹</button>
    <button className="arrow right" onClick={handleNext}>›</button>

    <div className="heart-container"></div>
  </div>
</div>



      </div>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{isLogin ? "Đăng nhập" : "Đăng ký tài khoản"}</h2>
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Họ và tên"
                    onChange={handleChange}
                    required
                  />
                  <select name="gender" onChange={handleChange}>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <input type="date" name="birthday" onChange={handleChange} />
                </>
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                onChange={handleChange}
                required
              />
              <button type="submit" className="btn-submit">
                {isLogin ? "Đăng nhập" : "Đăng ký"}
              </button>
            </form>

            <p className="switch">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </span>
            </p>
          </div>
        </div>
      )}

            {/* ===== SIMPLE FOOTER ===== */}
      <footer className="simple-footer">
        <p>
          © 2025 LoveConnect · Thiết kế & phát triển bởi 
          <strong> Nhóm 9 – Lập Trình Web</strong>
        </p>
      </footer>

    </>
  );
}
