from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from auth.dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from pathlib import Path
import shutil
import os

router = APIRouter(prefix="/users", tags=["Users"])

# ===============================
# 📦 SCHEMA PHỤ (Profile & Update)
# ===============================

class PhotoResponse(BaseModel):
    photo_id: int
    url: str
    is_avatar: bool

    class Config:
        from_attributes = True # 👈 Đã sửa từ orm_mode


class UserProfileResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    gender: str
    role: Optional[str] = "user" # Thêm role để trả về cho frontend
    birthday: Optional[date] = None
    job: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    height: Optional[str] = None
    photos: List[PhotoResponse] = []
    interests: List[str] = []

    class Config:
        from_attributes = True # 👈 Đã sửa từ orm_mode


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None # Sửa kiểu dữ liệu cho đúng
    job: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    height: Optional[str] = None


# ===============================
# 📌 API: Lấy thông tin người dùng hiện tại
# ===============================

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Lấy thông tin mới nhất từ DB để đảm bảo role được cập nhật
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Lấy ảnh
    photos = db.execute(
        text("SELECT photo_id, url, is_avatar FROM photos WHERE user_id = :uid"),
        {"uid": user.user_id}
    ).fetchall()

    # ✅ Lấy sở thích
    interests = db.execute(
        text("""
            SELECT i.name FROM interests i
            JOIN user_interests ui ON i.interest_id = ui.interest_id
            WHERE ui.user_id = :uid
        """),
        {"uid": user.user_id}
    ).fetchall()

    # Trả về dict kết hợp dữ liệu user và các list phụ
    return {
        **user.__dict__,
        "photos": [dict(p._mapping) for p in photos],
        "interests": [i[0] for i in interests],
    }


# ===============================
# ✏️ API: Cập nhật hồ sơ cá nhân
# ===============================

@router.put("/me", response_model=UserProfileResponse)
def update_profile(
    update_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Cập nhật các field có giá trị
    update_dict = update_data.model_dump(exclude_unset=True) # Dùng model_dump cho Pydantic V2
    for field, value in update_dict.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    # ✅ Lấy lại ảnh + sở thích để trả về full profile
    photos = db.execute(
        text("SELECT photo_id, url, is_avatar FROM photos WHERE user_id = :uid"),
        {"uid": user.user_id}
    ).fetchall()
    interests = db.execute(
        text("""
            SELECT i.name FROM interests i
            JOIN user_interests ui ON i.interest_id = ui.interest_id
            WHERE ui.user_id = :uid
        """),
        {"uid": user.user_id}
    ).fetchall()

    return {
        **user.__dict__,
        "photos": [dict(p._mapping) for p in photos],
        "interests": [i[0] for i in interests],
    }

# ===============================
# 📸 API: Cập nhật ảnh đại diện
# ===============================

@router.post("/me/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 🧩 Tạo thư mục uploads nếu chưa có
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    # 🧩 Lưu file vào thư mục
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🧩 Chuẩn hóa đường dẫn
    public_url = "/" + str(Path(file_path)).replace("\\", "/")

    # 🧩 Đặt ảnh cũ về is_avatar=0
    db.execute(text("UPDATE photos SET is_avatar = 0 WHERE user_id = :uid"), {"uid": current_user.user_id})

    # 🧩 Lưu ảnh mới
    db.execute(text("""
        INSERT INTO photos (user_id, url, is_avatar)
        VALUES (:uid, :url, 1)
    """), {"uid": current_user.user_id, "url": public_url})

    db.commit()

    return {"message": "Avatar updated", "url": public_url}


# ===============================
# 💖 API: Cập nhật sở thích
# ===============================

@router.put("/me/interests")
def update_interests(
    interests: list[str] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ✅ Xóa toàn bộ sở thích cũ của user
    db.execute(text("DELETE FROM user_interests WHERE user_id = :uid"), {"uid": current_user.user_id})

    for name in interests:
        if not name.strip():
            continue

        # ✅ Chuẩn hóa chữ
        name = name.strip().capitalize()

        # ✅ Kiểm tra sở thích đã tồn tại chưa
        existing = db.execute(text("SELECT interest_id FROM interests WHERE LOWER(name) = LOWER(:n)"), {"n": name}).fetchone()

        # ✅ Nếu chưa có -> thêm mới vào bảng interests
        if not existing:
            db.execute(text("INSERT INTO interests (name) VALUES (:n)"), {"n": name})
            db.commit()
            # Lấy lại ID vừa tạo
            existing = db.execute(text("SELECT interest_id FROM interests WHERE name = :n"), {"n": name}).fetchone()

        # ✅ Thêm liên kết user - interest
        # Kiểm tra existing[0] có tồn tại ko để tránh lỗi index
        if existing:
            db.execute(
                text("INSERT INTO user_interests (user_id, interest_id) VALUES (:u, :i)"),
                {"u": current_user.user_id, "i": existing[0]},
            )

    db.commit()

    # ✅ Trả về danh sách cập nhật mới nhất
    result = db.execute(
        text("""
            SELECT i.name FROM interests i
            JOIN user_interests ui ON i.interest_id = ui.interest_id
            WHERE ui.user_id = :uid
        """),
        {"uid": current_user.user_id}
    ).fetchall()

    return {"message": "✅ Cập nhật sở thích thành công", "interests": [r[0] for r in result]}


# ===============================
# 👁️ API: Xem hồ sơ người khác (Read-only)
# ===============================
@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    photos = db.execute(
        text("SELECT photo_id, url, is_avatar FROM photos WHERE user_id = :uid"),
        {"uid": user.user_id}
    ).fetchall()

    interests = db.execute(
        text("""
            SELECT i.name FROM interests i
            JOIN user_interests ui ON i.interest_id = ui.interest_id
            WHERE ui.user_id = :uid
        """),
        {"uid": user.user_id}
    ).fetchall()

    return {
        **user.__dict__,
        "photos": [dict(p._mapping) for p in photos],
        "interests": [i[0] for i in interests],
    }