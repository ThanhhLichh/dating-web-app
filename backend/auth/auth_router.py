from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from utils.hashing import verify_password, get_password_hash
from auth.auth_schema import LoginRequest, TokenResponse
from auth.jwt_handler import create_access_token
from auth.dependencies import get_current_user
from pydantic import BaseModel, EmailStr
from datetime import date
from auth.auth_schema import ChangePasswordRequest  # nhớ import schema

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ==========================================
# 🔑 LOGIN
# ==========================================
@router.post("/login", response_model=TokenResponse)
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email hoặc mật khẩu không đúng")

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email hoặc mật khẩu không đúng")

    # ✅ Cập nhật trạng thái online
    db.execute(
        text("UPDATE users SET is_online = 1 WHERE user_id = :uid"),
        {"uid": user.user_id},
    )
    db.commit()

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
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    hashed_pw = get_password_hash(request.password)

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
        is_online=0
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "✅ Đăng ký thành công", "user_id": new_user.user_id}


# ==========================================
# 🚪 LOGOUT
# ==========================================
@router.post("/logout")
def logout_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE users SET is_online = 0 WHERE user_id = :uid"),
        {"uid": current_user.user_id},
    )
    db.commit()
    return {"message": "👋 Đăng xuất thành công!"}


# ==========================================
# 🔐 CHANGE PASSWORD
# ==========================================


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # 1. Kiểm tra mật khẩu cũ
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu cũ không đúng"
        )

    # 2. Không cho phép trùng mật khẩu cũ
    if verify_password(data.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới không được trùng mật khẩu cũ"
        )

    # 3. Hash mật khẩu mới
    new_hashed = get_password_hash(data.new_password)
    current_user.password_hash = new_hashed

    db.add(current_user)
    db.commit()

    return {"message": "Đổi mật khẩu thành công 🎉"}

