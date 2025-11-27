import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdPeople,
  MdFavorite,
  MdMessage,
} from "react-icons/md";
import "./AdminSidebar.css";
import logo from "../../assets/logo.svg";

export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={onClose}
      ></div>

      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <img src={logo} alt="LoveConnect logo" className="brand-logo" />

          <div className="brand-text">
            <span className="admin">Admin</span>
            <span className="name">LoveConnect</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard">
            <MdDashboard /> Dashboard
          </NavLink>

          <NavLink to="/admin/users">
            <MdPeople /> Users
          </NavLink>

          <NavLink to="/admin/matches">
            <MdFavorite /> Matches
          </NavLink>

          <NavLink to="/admin/messages">
            <MdMessage /> Messages
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
