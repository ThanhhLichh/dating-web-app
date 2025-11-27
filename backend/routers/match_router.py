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

# ============================
# 🎉 GHÉP ĐÔI NGẪU NHIÊN
# ============================
@router.post("/random")
def random_match(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    uid = current_user.user_id

    # ⭐ FIX ENUM → STRING
    user_gender = current_user.gender
    if hasattr(user_gender, "value"):
        user_gender = user_gender.value

    # 1️⃣ Tìm user phù hợp
    sql = text("""
        SELECT u.user_id, u.full_name,
               (SELECT url FROM photos WHERE user_id = u.user_id AND is_avatar = 1 LIMIT 1) AS avatar
        FROM users u
        WHERE u.user_id != :uid
          AND u.is_admin = 0
          AND (
                (:gender = 'male' AND u.gender = 'female') OR
                (:gender = 'female' AND u.gender = 'male') OR
                (:gender = 'other' AND u.gender = 'other')
              )
          AND u.user_id NOT IN (
              SELECT user1_id FROM matches WHERE user2_id = :uid
              UNION
              SELECT user2_id FROM matches WHERE user1_id = :uid
          )
        ORDER BY RAND()
        LIMIT 1
    """)

    target = db.execute(sql, {"uid": uid, "gender": user_gender}).fetchone()

    if not target:
        return {"message": "Không tìm thấy ai phù hợp để ghép đôi!", "matched_user": None}

    target_id = target.user_id

    # 2️⃣ Tạo match
    insert_sql = text("""
        INSERT INTO matches (user1_id, user2_id, status)
        VALUES (:u1, :u2, 'active')
    """)
    db.execute(insert_sql, {"u1": uid, "u2": target_id})
    db.commit()

    # 3️⃣ Lấy match_id
    match_row = db.execute(text("""
        SELECT match_id FROM matches
        WHERE ((user1_id = :u1 AND user2_id = :u2) 
            OR (user1_id = :u2 AND user2_id = :u1))
        ORDER BY match_id DESC
        LIMIT 1
    """), {"u1": uid, "u2": target_id}).fetchone()

    return {
        "message": "Ghép đôi thành công!",
        "match_id": match_row.match_id,
        "matched_user": {
            "user_id": target.user_id,
            "full_name": target.full_name,
            "avatar": target.avatar
        }
    }


