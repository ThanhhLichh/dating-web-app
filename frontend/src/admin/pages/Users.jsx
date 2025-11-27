import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import AdminLayout from "../layout/AdminLayout";
import "./Admin.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    const res = await adminApi.get(`/admin/users?search=${search}`);
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, [search]); // gọi lại khi search đổi

  const banUser = async (id) => {
    await adminApi.put(`/admin/users/${id}/ban`);
    fetchUsers();
  };

  const unbanUser = async (id) => {
    await adminApi.put(`/admin/users/${id}/unban`);
    fetchUsers();
  };

  return (
    <AdminLayout>
      <h1 className="admin-title">👥 Users</h1>

      {/* 🔍 Search */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Giới tính</th>
              <th>Trạng thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.gender}</td>
                <td>{u.is_banned ? "⛔ Banned" : "✔ Active"}</td>
                <td>
                  {u.is_banned ? (
                    <button className="btn-unban" onClick={() => unbanUser(u.user_id)}>Unban</button>
                  ) : (
                    <button className="btn-ban" onClick={() => banUser(u.user_id)}>Ban</button>
                  )}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="6" className="empty">Không tìm thấy user nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
