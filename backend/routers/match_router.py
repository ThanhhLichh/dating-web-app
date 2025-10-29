from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from auth.dependencies import get_current_user

router = APIRouter(prefix="/matches", tags=["Matches"])

# ✅ API: Lấy danh sách người đã match với user hiện tại + tin nhắn cuối cùng
@router.get("/")
def get_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sql = text("""
        SELECT 
            m.match_id,
            CASE 
                WHEN m.user1_id = :uid THEN m.user2_id 
                ELSE m.user1_id 
            END AS partner_id,
            u.full_name,
            p.url AS avatar_url,
            m.created_at,
            (
                SELECT msg.content
                FROM messages msg
                WHERE msg.match_id = m.match_id
                ORDER BY msg.created_at DESC
                LIMIT 1
            ) AS last_message,
            (
                SELECT msg.created_at
                FROM messages msg
                WHERE msg.match_id = m.match_id
                ORDER BY msg.created_at DESC
                LIMIT 1
            ) AS last_message_time
        FROM matches m
        JOIN users u 
            ON u.user_id = CASE 
                WHEN m.user1_id = :uid THEN m.user2_id 
                ELSE m.user1_id 
            END
        LEFT JOIN photos p 
            ON u.user_id = p.user_id AND p.is_avatar = 1
        WHERE (m.user1_id = :uid OR m.user2_id = :uid)
          AND m.status = 'active'
        ORDER BY 
            COALESCE(last_message_time, m.created_at) DESC
    """)
    
    results = db.execute(sql, {"uid": current_user.user_id}).fetchall()
    return [dict(r._mapping) for r in results]
