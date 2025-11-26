import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import "./AdminLayout.css";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <AdminNavbar />
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
