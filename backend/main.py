from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine


# Import các router
from routers import (
    user_router, 
    photo_router, 
    home_router, 
    notification_router, 
    match_router, 
    message_router,
    event_router,
    
)

from routers import admin_router
from auth import auth_router
from fastapi.staticfiles import StaticFiles
from websocket import message_ws, call_ws, event_chat_ws


app = FastAPI(title="LoveConnect API ❤️")

# ✅ CẤU HÌNH CORS (SỬA LẠI ĐOẠN NÀY)
# Cho phép tất cả ["*"] để tránh lỗi 127.0.0.1 vs localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 👈 ĐỔI THÀNH "*" ĐỂ CHẤP NHẬN TẤT CẢ
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các phương thức (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],  # Cho phép tất cả headers
    expose_headers=["*"],      
)

# ✅ Khởi tạo database
Base.metadata.create_all(bind=engine)

# ✅ Gắn các router
app.include_router(user_router.router)
app.include_router(auth_router.router)
app.include_router(photo_router.router) 
app.include_router(home_router.router)
app.include_router(notification_router.router)
app.include_router(match_router.router)
app.include_router(message_router.router)
app.include_router(admin_router.router)
app.include_router(event_router.router)

# ✅ WebSocket Routers
app.include_router(message_ws.router)
app.include_router(call_ws.router)
app.include_router(event_chat_ws.router)

# ✅ Mount thư mục uploads để xem được ảnh
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ✅ Route kiểm tra
@app.get("/")
def home():
    return {"message": "Welcome to LoveConnect API"}