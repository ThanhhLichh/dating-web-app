from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from auth.dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from pathlib import Path

router = APIRouter(prefix="/users", tags=["Users"])

# ===============================
# 📦 SCHEMA PHỤ (Profile & Update)
# ===============================

class PhotoResponse(BaseModel):
    photo_id: int
    url: str
    is_avatar: bool

    class Config:
        orm_mode = True


class UserProfileResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    gender: str
    birthday: Optional[date]
    job: Optional[str]
    city: Optional[str]
    bio: Optional[str]
    height: Optional[str]
    photos: List[PhotoResponse] = []
    interests: List[str] = []

    class Config:
        orm_mode = True


class UserUpdateRequest(BaseModel):
    full_name: Optional[str]
    gender: Optional[str]
    birthday: Optional[str]
    job: Optional[str]
    city: Optional[str]
    bio: Optional[str]
    height: Optional[str]


# ===============================
# 📌 API: Lấy thông tin người dùng hiện tại
# ===============================

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Lấy ảnh (dùng text() đúng cú pháp SQLAlchemy 2.0)
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
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    # ✅ Lấy lại ảnh + sở thích
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
from fastapi import UploadFile, File

@router.post("/me/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import shutil, os
    from pathlib import Path
    from sqlalchemy import text

    # 🧩 Tạo thư mục uploads nếu chưa có
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    # 🧩 Lưu file vào thư mục
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🧩 Chuẩn hóa đường dẫn (tránh lỗi \ trên Windows)
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
from fastapi import Body

@router.put("/me/interests")
def update_interests(
    interests: list[str] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.execute(text("DELETE FROM user_interests WHERE user_id = :uid"), {"uid": current_user.user_id})
    for name in interests:
        interest = db.execute(text("SELECT interest_id FROM interests WHERE name = :n"), {"n": name}).fetchone()
        if interest:
            db.execute(text("INSERT INTO user_interests (user_id, interest_id) VALUES (:u, :i)"),
                       {"u": current_user.user_id, "i": interest[0]})
    db.commit()
    return {"message": "Cập nhật sở thích thành công", "interests": interests}

