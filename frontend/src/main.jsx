import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import { LoaderProvider } from "./context/LoaderContext.jsx";  // ✅ thêm

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <LoaderProvider>     {/* ✅ Bọc App để toàn bộ website dùng chung loader */}
      <App />
    </LoaderProvider>
  </BrowserRouter>
);
