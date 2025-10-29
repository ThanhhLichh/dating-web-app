from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from auth.dependencies import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

# 📨 Lấy danh sách tin nhắn trong một match
@router.get("/{match_id}")
def get_messages(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ Kiểm tra xem user có thuộc match này không
    match = db.execute(
        text("""
        SELECT * FROM matches
        WHERE match_id = :mid 
        AND (user1_id = :uid OR user2_id = :uid)
    """),
        {"mid": match_id, "uid": current_user.user_id},
    ).fetchone()

    if not match:
        raise HTTPException(
            status_code=403, detail="Bạn không có quyền xem cuộc trò chuyện này"
        )

    # ✅ Lấy danh sách tin nhắn kèm flag 'is_me'
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


# 💬 Gửi tin nhắn mới (text)
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

    # ✅ Kiểm tra xem user có thuộc match này không
    match = db.execute(
        text("""
        SELECT * FROM matches
        WHERE match_id = :mid 
        AND (user1_id = :uid OR user2_id = :uid)
    """),
        {"mid": match_id, "uid": current_user.user_id},
    ).fetchone()

    if not match:
        raise HTTPException(
            status_code=403, detail="Bạn không thể gửi tin trong cuộc trò chuyện này"
        )

    # ⚠️ KHÔNG lưu tin nhắn ở đây nữa (đã được WebSocket xử lý)
    # Chỉ trả về xác nhận OK để frontend không lỗi
    return {"message": "Tin nhắn đã gửi qua WebSocket realtime!"}
