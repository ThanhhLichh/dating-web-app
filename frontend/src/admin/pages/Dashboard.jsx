import { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import AdminLayout from "../layout/AdminLayout";
import "./Dashboard.css";

import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import {
  HiUsers,
  HiUserGroup,
  HiUserMinus,
  HiHeart,
  HiChatBubbleLeftRight,
} from "react-icons/hi2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    adminApi.get("/admin/stats").then((res) => setStats(res.data));
    adminApi.get("/admin/top-message-users").then((res) => setTopUsers(res.data));
  }, []);

  if (!stats)
    return (
      <AdminLayout>
        <div className="loading-box">Đang tải Dashboard...</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <h1 className="page-title">
        📊 <span>Thống kê tổng quan</span>
      </h1>

      {/* ==== STAT CARDS ==== */}
      <div className="stats-grid">
        <div className="stat-card sc1">
          <div>
            <p className="stat-title">Tổng người dùng</p>
            <p className="stat-number">{stats.total_users}</p>
          </div>
          <HiUsers className="stat-icon" />
        </div>

        <div className="stat-card sc2">
          <div>
            <p className="stat-title">Đang Online</p>
            <p className="stat-number">{stats.online_users}</p>
          </div>
          <HiUserGroup className="stat-icon" />
        </div>

        <div className="stat-card sc3">
          <div>
            <p className="stat-title">Tài khoản bị khóa</p>
            <p className="stat-number">{stats.banned_users}</p>
          </div>
          <HiUserMinus className="stat-icon" />
        </div>

        <div className="stat-card sc4">
          <div>
            <p className="stat-title">Tổng Matches</p>
            <p className="stat-number">{stats.total_matches}</p>
          </div>
          <HiHeart className="stat-icon" />
        </div>
      </div>

      {/* ==== CHARTS ==== */}
      <div className="charts-grid">
        <div className="chart-box">
          <h3 className="chart-title">
            <HiChatBubbleLeftRight className="chart-icon" /> Tin nhắn 7 ngày gần nhất
          </h3>
          <Bar
            data={{
              labels: ["T-6", "T-5", "T-4", "T-3", "T-2", "Hôm qua", "Hôm nay"],
              datasets: [
                {
                  label: "Tin nhắn",
                  data: stats.messages_chart,
                  backgroundColor: "#6366f1",
                  borderRadius: 6,
                },
              ],
            }}
          />
        </div>

        <div className="chart-box">
          <h3 className="chart-title">📈 Lượt Match theo ngày</h3>
          <Line
            data={{
              labels: ["T-6", "T-5", "T-4", "T-3", "T-2", "Hôm qua", "Hôm nay"],
              datasets: [
                {
                  label: "Matches",
                  data: stats.matches_chart,
                  borderColor: "#10b981",
                  backgroundColor: "rgba(16,185,129,0.3)",
                  tension: 0.35,
                  borderWidth: 3,
                },
              ],
            }}
          />
        </div>

        <div className="chart-box">
          <h3 className="chart-title">🎯 Tỉ lệ giới tính người dùng</h3>
          <Doughnut
            data={{
              labels: ["Nam", "Nữ", "Khác"],
              datasets: [
                {
                  data: [
                    stats.gender_ratio.male,
                    stats.gender_ratio.female,
                    stats.gender_ratio.other,
                  ],
                  backgroundColor: ["#3b82f6", "#ec4899", "#f59e0b"],
                  borderWidth: 2,
                },
              ],
            }}
          />
        </div>
      </div>

      {/* ==== TOP 10 USERS ==== */}
      <div className="chart-box top-users">
        <h3 className="chart-title">🏆 Top 10 người nhắn tin nhiều nhất</h3>

        <table className="top-table">
          <thead>
            <tr>
              <th>Top</th>
              <th>Tên người dùng</th>
              <th>Số tin nhắn</th>
            </tr>
          </thead>
          <tbody>
            {topUsers.map((u, i) => (
              <tr key={u.user_id}>
                <td>{i + 1}</td>
                <td>{u.full_name}</td>
                <td>{u.total_messages}</td>
              </tr>
            ))}
            {topUsers.length === 0 && (
              <tr>
                <td colSpan="3" className="empty-row">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
