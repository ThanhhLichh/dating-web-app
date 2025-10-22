import { useState } from "react";
import { login, register } from "../services/authService";
import "./Auth.css";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    gender: "male",
    birthday: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra!");
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT SIDE */}
      <div className="auth-left">
        <div className="logo">
          <h1>💞 LoveConnect</h1>
        </div>

        <div className="intro">
          <h2>{isLogin ? "Chào mừng trở lại 💌" : "Tạo tài khoản mới 💘"}</h2>
          <p>
            {isLogin
              ? "Kết nối trái tim, tìm người thương của bạn ngay hôm nay."
              : "Gia nhập cộng đồng LoveConnect và bắt đầu hành trình của bạn!"}
          </p>
        </div>

        <div className={`form-wrapper ${isLogin ? "" : "active"}`}>
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
                <input
                  type="date"
                  name="birthday"
                  onChange={handleChange}
                />
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
            <button type="submit">
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

      {/* RIGHT SIDE */}
      <div className="auth-right">
        <div className="gradient-overlay"></div>
        <img
          src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80"
          alt="Couple illustration"
        />
      </div>
    </div>
  );
}
