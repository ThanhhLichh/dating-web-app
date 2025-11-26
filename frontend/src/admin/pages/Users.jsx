import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import AdminLayout from "../layout/AdminLayout";
import "./Admin.css";

export default function Users() {
  const [users, setUsers] = useState([]);

  const fetchUsers = () => {
    adminApi.get("/admin/users").then((res) => setUsers(res.data));
  };

  useEffect(fetchUsers, []);

  const banUser = (id) => {
    adminApi.put(`/admin/users/${id}/ban`).then(fetchUsers);
  };

  const unbanUser = (id) => {
    adminApi.put(`/admin/users/${id}/unban`).then(fetchUsers);
  };

  return (
    <AdminLayout>
      <h1 className="admin-title">👥 Users</h1>

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
                  <button className="btn-unban" onClick={() => unbanUser(u.user_id)}>
                    Unban
                  </button>
                ) : (
                  <button className="btn-ban" onClick={() => banUser(u.user_id)}>
                    Ban
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
