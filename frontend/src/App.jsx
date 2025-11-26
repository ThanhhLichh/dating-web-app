import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

// USER PAGES
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
import Messages from "./pages/Messages.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About.jsx";

// LOADER
import PageLoader from "./components/PageLoader";

// ADMIN PAGES
import AdminLogin from "./admin/AdminLogin";
import Dashboard from "./admin/pages/Dashboard.jsx";
import Users from "./admin/pages/Users.jsx";
import Matches from "./admin/pages/Matches.jsx";
import AdminMessages from "./admin/pages/Messages.jsx";
import RequireAdmin from "./admin/RequireAdmin";


export default function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // ⭐ Page transition loading
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <>
      {/* ⭐ GLOBAL TOASTER */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            fontSize: "15px",
            padding: "12px 16px",
            borderRadius: "10px",
          },
        }}
      />

      <PageLoader show={loading} />

      <Routes>
        {/* ============================
                USER ROUTES
        ============================ */}

        <Route path="/" element={<Auth />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        <Route path="/about" element={<About />} />

        {/* ============================
                ADMIN ROUTES
        ============================ */}

        {/* Redirect /admin → /admin/login */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Protected Pages */}
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdmin>
              <Dashboard />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RequireAdmin>
              <Users />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/matches"
          element={
            <RequireAdmin>
              <Matches />
            </RequireAdmin>
          }
        />
        <Route
  path="/admin/messages"
  element={
    <RequireAdmin>
      <AdminMessages />
    </RequireAdmin>
  }
/>


        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
