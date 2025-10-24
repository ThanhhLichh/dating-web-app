from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from auth.dependencies import get_current_user
import os, shutil
from pathlib import Path

router = APIRouter(prefix="/photos", tags=["Photos"])

# ===============================
# 📸 Upload ảnh mới (không phải avatar)
# ===============================
@router.post("/me")
def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    # Lưu file vào thư mục uploads/
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Đảm bảo đường dẫn đúng định dạng URL
    url = "/" + str(Path(file_path)).replace("\\", "/")

    db.execute(text("""
        INSERT INTO photos (user_id, url, is_avatar)
        VALUES (:uid, :url, 0)
    """), {"uid": current_user.user_id, "url": url})
    db.commit()

    return {"message": "Ảnh đã được thêm vào bộ sưu tập", "url": url}


# ===============================
# 👑 Đặt ảnh làm ảnh đại diện
# ===============================
@router.put("/me/{photo_id}/set_avatar")
def set_avatar(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    photo = db.execute(
        text("SELECT * FROM photos WHERE photo_id = :pid AND user_id = :uid"),
        {"pid": photo_id, "uid": current_user.user_id}
    ).fetchone()

    if not photo:
        raise HTTPException(status_code=404, detail="Ảnh không tồn tại")

    # Reset ảnh cũ & đặt ảnh mới làm avatar
    db.execute(text("UPDATE photos SET is_avatar = 0 WHERE user_id = :uid"), {"uid": current_user.user_id})
    db.execute(text("UPDATE photos SET is_avatar = 1 WHERE photo_id = :pid"), {"pid": photo_id})
    db.commit()

    return {"message": "Đặt làm ảnh đại diện thành công"}


# ===============================
# 🗑️ Xóa ảnh khỏi bộ sưu tập
# ===============================
@router.delete("/me/{photo_id}")
def delete_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    photo = db.execute(
        text("SELECT * FROM photos WHERE photo_id = :pid AND user_id = :uid"),
        {"pid": photo_id, "uid": current_user.user_id}
    ).fetchone()

    if not photo:
        raise HTTPException(status_code=404, detail="Ảnh không tồn tại")

    # Xóa file vật lý nếu có
    if photo.url and os.path.exists(photo.url.strip("/")):
        try:
            os.remove(photo.url.strip("/"))
        except Exception:
            pass

    db.execute(
        text("DELETE FROM photos WHERE photo_id = :pid AND user_id = :uid"),
        {"pid": photo_id, "uid": current_user.user_id}
    )
    db.commit()

    return {"message": "Ảnh đã được xóa"}
