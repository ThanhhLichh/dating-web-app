from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from utils.hashing import verify_password, get_password_hash
from auth.auth_schema import LoginRequest, TokenResponse
from auth.jwt_handler import create_access_token
from pydantic import BaseModel, EmailStr
from datetime import date

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ==========================================
# 🔑 LOGIN
# ==========================================
@router.post("/login", response_model=TokenResponse)
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# 🧩 REGISTER
# ==========================================
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    gender: str
    birthday: date | None = None

@router.post("/register")
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    # Kiểm tra trùng email
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    # Hash mật khẩu
    hashed_pw = get_password_hash(request.password)

    # Thêm user mới (các trường khác mặc định NULL)
    new_user = User(
        email=request.email,
        password_hash=hashed_pw,
        full_name=request.full_name,
        gender=request.gender,
        birthday=request.birthday,
        job=None,
        city=None,
        bio=None,
        height=None,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "✅ Đăng ký thành công", "user_id": new_user.user_id}
