import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import AdminLayout from "../layout/AdminLayout";
import toast from "react-hot-toast";
import "./Admin.css";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [search, setSearch] = useState("");

  const loadMatches = async () => {
    try {
      const res = await adminApi.get(`/admin/matches?search=${search}`);
      setMatches(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách match!");
    }
  };

  useEffect(() => {
    loadMatches();
  }, [search]); // gọi lại khi search thay đổi

  const deleteMatch = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa Match này?")) return;

    try {
      await adminApi.delete(`/admin/matches/${id}`);
      toast.success("Đã xóa Match!");
      loadMatches();
    } catch (err) {
      toast.error("Không thể xóa Match!");
    }
  };

  return (
    <AdminLayout>
      <h1 className="admin-title">💞 Matches</h1>

      {/* 🔍 Search matches */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Tìm theo tên người dùng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User 1</th>
              <th>User 2</th>
              <th>Ngày</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {matches.map((m) => (
              <tr key={m.match_id}>
                <td>{m.match_id}</td>
                <td>{m.user1_name}</td>
                <td>{m.user2_name}</td>
                <td>{m.created_at}</td>
                <td>
                  <button className="delete-btn" onClick={() => deleteMatch(m.match_id)}>Xóa</button>
                </td>
              </tr>
            ))}

            {matches.length === 0 && (
              <tr>
                <td colSpan="5" className="empty">Không tìm thấy match nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
