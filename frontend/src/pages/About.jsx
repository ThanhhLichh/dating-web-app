// pages/About.jsx
import logo from "../assets/logo.svg";
import "./About.css";

export default function About() {
  return (
    <>
      {/* ===== NAVBAR LANDING ===== */}
      <nav className="topbar">
  <div className="topbar-left">

    {/* 🔥 Thêm link cho logo để quay về trang chủ */}
    <a href="/" className="brand">
      <img src={logo} alt="LoveConnect logo" />
      <span>LoveConnect</span>
    </a>

    <div className="nav-links">
      <a
        href="https://mail.google.com/mail/?view=cm&fs=1&to=buithanhlich@gmail.com"
        target="_blank"
      >
        Liên hệ
      </a>

      <a href="/about" className="active">
        Về chúng tôi
      </a>
    </div>
  </div>

  <div className="topbar-right">
    <a href="/" className="btn-primary">
      Trang chủ
    </a>
  </div>
</nav>


      {/* ===== ABOUT CONTENT ===== */}
      <div className="about-container">
        <section className="about-hero">
          <h1>💞 Về LoveConnect</h1>
          <p>
            LoveConnect được tạo ra với sứ mệnh mang đến sự kết nối chân thật,
            nơi mà trái tim gặp trái tim – không phán xét, không rào cản.
          </p>
        </section>

        <section className="about-section">
          <h2>🌟 Sứ mệnh</h2>
          <p>
            Tạo ra một nền tảng hẹn hò hiện đại, an toàn, thân thiện và mang lại
            các kết nối có ý nghĩa và lâu dài.
          </p>
        </section>

        <section className="about-section">
          <h2>💗 Giá trị cốt lõi</h2>
          <ul>
            <li>✔ Tôn trọng & chân thành</li>
            <li>✔ Kết nối dựa trên sự phù hợp thực tế</li>
            <li>✔ Trải nghiệm đơn giản, mượt mà</li>
            <li>✔ Bảo mật thông tin hàng đầu</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>👨‍💻 Đội ngũ phát triển</h2>
          <p>
            LoveConnect được phát triển bởi đội ngũ trẻ đầy đam mê, mong muốn tạo
            ra ứng dụng kết nối ý nghĩa và hiện đại nhất cho người Việt.
          </p>
        </section>

        <section className="about-contact">
          <h2>📩 Liên hệ</h2>
          <p>Nếu bạn có câu hỏi, góp ý hoặc muốn hợp tác:</p>

          <a
            className="contact-btn"
            href="https://mail.google.com/mail/?view=cm&fs=1&to=buithanhlich@gmail.com"
            target="_blank"
          >
            Gửi Email 💌
          </a>
        </section>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="simple-footer">
        <p>
          © 2025 LoveConnect · Thiết kế & phát triển bởi
          <strong> Nhóm 9 – Lập Trình Web</strong>
        </p>
      </footer>
    </>
  );
}
