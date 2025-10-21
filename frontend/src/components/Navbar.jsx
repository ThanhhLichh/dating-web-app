import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "10px 20px", background: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
      <Link to="/" style={{ marginRight: 20 }}>🏠 Home</Link>
      <Link to="/login" style={{ marginRight: 20 }}>🔐 Login</Link>
      <Link to="/register" style={{ marginRight: 20 }}>📝 Register</Link>
      <Link to="/profile">👤 Profile</Link>
    </nav>
  );
}
