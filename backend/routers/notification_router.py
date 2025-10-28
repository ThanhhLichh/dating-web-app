from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from auth.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sql = text("""
        SELECT n.noti_id, n.type, n.content, n.is_read, n.created_at,
               u.full_name AS sender_name, p.url AS sender_avatar, u.user_id AS sender_id
        FROM notifications n
        LEFT JOIN users u ON n.from_user_id = u.user_id
        LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_avatar = 1
        WHERE n.user_id = :uid
        ORDER BY n.created_at DESC
    """)
    rows = db.execute(sql, {"uid": current_user.user_id}).fetchall()
    return [dict(r._mapping) for r in rows]
