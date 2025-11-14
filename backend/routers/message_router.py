import shutil
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from auth.dependencies import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

# ==================================================================
# 🚨 QUAN TRỌNG: API UPLOAD PHẢI NẰM TRÊN CÙNG
# (Trước các API có tham số động /{match_id})
# ==================================================================

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # 1. Tạo thư mục uploads nếu chưa có
    UPLOAD_DIR = "uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    # 2. Tạo tên file ngẫu nhiên (tránh trùng tên)
    # Ví dụ: anh_cu.jpg -> 550e8400-e29b....jpg
    file_extension = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)

    # 3. Lưu file vào ổ cứng
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Xác định loại file dựa trên đuôi mở rộng
    msg_type = "file"
    ext = file_extension.lower()
    if ext in ["jpg", "jpeg", "png", "gif", "webp"]:
        msg_type = "image"
    elif ext in ["mp4", "mov", "avi", "webm"]:
        msg_type = "video"

    # 5. Trả về đường dẫn để Frontend gửi tin nhắn
    return {
        "url": f"/uploads/{new_filename}",
        "type": msg_type
    }

# ==================================================================
# 👇 CÁC API CÓ THAM SỐ ĐỘNG /{match_id} PHẢI NẰM DƯỚI 👇
# ==================================================================

# 📨 Lấy danh sách tin nhắn
@router.get("/{match_id}")
def get_messages(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Kiểm tra xem user có thuộc match này không
    match = db.execute(
        text("SELECT * FROM matches WHERE match_id = :mid AND (user1_id = :uid OR user2_id = :uid)"),
        {"mid": match_id, "uid": current_user.user_id},
    ).fetchone()

    if not match:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem cuộc trò chuyện này")

    # Truy vấn tin nhắn + thông tin người gửi
    sql = text("""
        SELECT 
            m.message_id,
            m.sender_id,
            u.full_name AS sender_name,
            p.url AS sender_avatar,
            m.content,
            m.type,
            m.created_at,
            CASE WHEN m.sender_id = :uid THEN TRUE ELSE FALSE END AS is_me
        FROM messages m
        JOIN users u ON u.user_id = m.sender_id
        LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_avatar = 1
        WHERE m.match_id = :mid
        ORDER BY m.created_at ASC
    """)

    rows = db.execute(sql, {"mid": match_id, "uid": current_user.user_id}).fetchall()
    return [dict(r._mapping) for r in rows]


# 💬 Gửi tin nhắn (Text/Link ảnh)
@router.post("/{match_id}")
def send_message(
    match_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = data.get("content", "").strip()
    
    if not content:
        raise HTTPException(status_code=400, detail="Nội dung không được để trống")

    # Kiểm tra quyền
    match = db.execute(
        text("SELECT * FROM matches WHERE match_id = :mid AND (user1_id = :uid OR user2_id = :uid)"),
        {"mid": match_id, "uid": current_user.user_id},
    ).fetchone()

    if not match:
        raise HTTPException(status_code=403, detail="Không thể gửi tin trong cuộc trò chuyện này")

    # Lưu ý: Việc lưu tin nhắn thực tế vào DB được xử lý qua WebSocket (message_ws.py)
    # API này chỉ để xác nhận hoặc dùng nếu bạn muốn lưu qua HTTP
    return {"message": "Tin nhắn đã gửi"}