import { Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
import Messages from "./pages/Messages.jsx"; // ✅ Thêm dòng này
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About.jsx";


export default function App() {
  return (
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

      {/* ✅ Trang nhắn tin mới */}
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
  );
}
