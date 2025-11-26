import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../services/adminApi";

export default function RequireAdmin({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    adminApi
      .get("/auth/admin/me")
      .then((res) => {
        // ⭐ FIX: backend trả true/false, không phải 1/0
        if (!res.data.is_admin) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
        navigate("/admin/login");
      });
  }, []);

  if (loading) return <p>Đang kiểm tra quyền Admin...</p>;

  return children;
}
