import { Link } from "react-router-dom";

export default function App() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>LoveConnect ❤️</h1>
      <p>Ứng dụng hẹn hò của bạn</p>
      <Link to="/auth">
        <button
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: "#ff4b2b",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Đăng nhập / Đăng ký
        </button>
      </Link>
    </div>
  );
}
