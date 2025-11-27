import { useState } from "react";
import adminApi from "../../services/adminApi";
import AdminLayout from "../layout/AdminLayout";
import "./Messages.css";
import toast from "react-hot-toast";

export default function AdminMessages() {
  const [matchId, setMatchId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!matchId.trim()) {
      toast.error("Vui lòng nhập Match ID!");
      return;
    }

    setLoading(true);

    try {
      const res = await adminApi.get(`/admin/messages?match_id=${matchId}`);
      setMessages(res.data);

      res.data.length === 0
        ? toast("Không có tin nhắn nào!")
        : toast.success("Tải dữ liệu thành công!");
    } catch (err) {
      toast.error("Không thể tải tin nhắn!");
    }

    setLoading(false);
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa tin nhắn này?")) return;

    try {
      await adminApi.delete(`/admin/messages/${id}`);
      toast.success("Đã xóa!");

      setMessages((prev) => prev.filter((msg) => msg.message_id !== id));
    } catch (err) {
      toast.error("Không thể xóa tin nhắn!");
    }
  };

  return (
    <AdminLayout>
      <div className="admin-messages-page">
        <h1 className="admin-title">💬 Messages Viewer</h1>

        <div className="msg-input-box">
          <input
            type="number"
            placeholder="Nhập Match ID..."
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
          />
          <button onClick={fetchMessages} disabled={loading}>
            {loading ? "Đang tải..." : "Tải tin nhắn"}
          </button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người gửi</th>
                <th>Người nhận</th>
                <th>Nội dung</th>
                <th>Thời gian</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {messages.map((m) => (
                <tr key={m.message_id}>
                  <td>{m.message_id}</td>
                  <td>{m.sender_name}</td>
                  <td>{m.receiver_name}</td>
                  <td>{m.content}</td>
                  <td>{m.created_at}</td>
                  <td>
                    <button className="delete-btn" onClick={() => deleteMessage(m.message_id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}

              {messages.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="empty">Không có tin nhắn nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
