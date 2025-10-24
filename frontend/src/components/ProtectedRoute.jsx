import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    // ❌ Nếu chưa đăng nhập → quay về trang Auth
    return <Navigate to="/" replace />;
  }
  // ✅ Nếu có token → cho phép vào trang
  return children;
}
