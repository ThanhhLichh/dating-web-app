import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
import Messages from "./pages/Messages.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About.jsx";

import PageLoader from "./components/PageLoader"; // ⭐ Quan trọng

export default function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // ⭐ Mỗi lần đổi route -> bật animation loading
  useEffect(() => {
    setLoading(true);

    const t = setTimeout(() => {
      setLoading(false);
    }, 700); // bạn có thể chỉnh 300–600ms cho mượt

    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <>
      {/* ⭐ Loader overlay */}
      <PageLoader show={loading} />

      <Routes>
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
      </Routes>
    </>
  );
}
