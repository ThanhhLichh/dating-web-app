from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import user_router
from auth import auth_router

app = FastAPI(title="LoveConnect API ❤️")

# ✅ Thêm CORS middleware (rất quan trọng)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # domain của frontend React
    allow_credentials=True,
    allow_methods=["*"],  # cho phép tất cả phương thức: GET, POST, PUT, DELETE...
    allow_headers=["*"],  # cho phép tất cả headers (Authorization, Content-Type, ...)
)

# ✅ Khởi tạo database
Base.metadata.create_all(bind=engine)

# ✅ Gắn các router
app.include_router(user_router.router)
app.include_router(auth_router.router)

# ✅ Route kiểm tra
@app.get("/")
def home():
    return {"message": "Welcome to LoveConnect API"}
