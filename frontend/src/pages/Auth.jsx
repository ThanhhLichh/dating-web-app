import { useState } from "react";
import { login, register } from "../services/authService";
import "./Auth.css";
import logo from "../assets/logo.svg";
import newHeroImage from "../assets/sig2.png";

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
        alert("Đăng nhập thành công!");
      } else {
        await register(form);
        alert("Đăng ký thành công! Hãy đăng nhập.");
        setIsLogin(true);
      }
      setShowModal(false);
    } catch {
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
          <img src={newHeroImage} alt="Love illustration" />
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
    </>
  );
}
