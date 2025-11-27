from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth.dependencies import get_current_user
from models.user_model import User

router = APIRouter(prefix="/admin", tags=["Admin"])

# ============================
# CHECK ADMIN
# ============================
def require_admin(user: User):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Không có quyền Admin")
    return user


# ============================
# DASHBOARD
# ============================
# ============================
# DASHBOARD (PRO VERSION)
# ============================
@router.get("/stats")
def admin_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)

    # Tổng Users
    total_users = db.execute(text("SELECT COUNT(*) FROM users")).scalar()

    # User online
    online = db.execute(text("SELECT COUNT(*) FROM users WHERE is_online = 1")).scalar()

    # User bị ban
    banned = db.execute(text("SELECT COUNT(*) FROM users WHERE is_banned = 1")).scalar()

    # Tổng matches
    total_matches = db.execute(text("SELECT COUNT(*) FROM matches")).scalar()

    # ===== CHART: Messages 7 ngày =====
    messages_chart = db.execute(text("""
        SELECT COUNT(*) FROM messages 
        WHERE DATE(created_at) >= CURDATE() - INTERVAL 6 DAY 
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """)).fetchall()
    messages_chart = [row[0] for row in messages_chart]

    # ===== CHART: Matches 7 ngày =====
    matches_chart = db.execute(text("""
        SELECT COUNT(*) FROM matches 
        WHERE DATE(created_at) >= CURDATE() - INTERVAL 6 DAY 
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """)).fetchall()
    matches_chart = [row[0] for row in matches_chart]

    # ===== GENDER RATIO =====
    gender_data = db.execute(text("""
        SELECT gender, COUNT(*) 
        FROM users 
        GROUP BY gender
    """)).fetchall()

    gender_ratio = {
        "male": 0,
        "female": 0,
        "other": 0
    }

    for gender, count in gender_data:
        if gender in gender_ratio:
            gender_ratio[gender] = count

    return {
        "total_users": total_users,
        "online_users": online,
        "banned_users": banned,
        "total_matches": total_matches,

        # Charts
        "messages_chart": messages_chart,
        "matches_chart": matches_chart,
        "gender_ratio": gender_ratio
    }



# ============================
# USERS LIST
# ============================
@router.get("/users")
def admin_users(
    search: str = "",
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    require_admin(user)

    # Nếu có search
    if search:
        sql = text("""
            SELECT user_id, full_name, email, gender, is_banned, is_online, created_at
            FROM users
            WHERE is_admin = 0 
              AND (full_name LIKE :kw OR email LIKE :kw)
            ORDER BY user_id DESC
        """)
        data = db.execute(sql, {"kw": f"%{search}%"}).fetchall()

    # Nếu không có search
    else:
        sql = text("""
            SELECT user_id, full_name, email, gender, is_banned, is_online, created_at
            FROM users
            WHERE is_admin = 0
            ORDER BY user_id DESC
        """)
        data = db.execute(sql).fetchall()

    return [dict(r._mapping) for r in data]





# ============================
# BAN USER
# ============================
@router.put("/users/{uid}/ban")
def ban_user(uid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)

    db.execute(
        text("UPDATE users SET is_banned = 1 WHERE user_id = :uid"),
        {"uid": uid}
    )
    db.commit()

    return {"message": "Đã khóa tài khoản"}


# ============================
# UNBAN USER
# ============================
@router.put("/users/{uid}/unban")
def unban_user(uid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)

    db.execute(
        text("UPDATE users SET is_banned = 0 WHERE user_id = :uid"),
        {"uid": uid}
    )
    db.commit()

    return {"message": "Đã mở khóa tài khoản"}

# ============================
# TOP 10 USERS GỬI TIN NHẮN NHIỀU NHẤT
# ============================
@router.get("/top-message-users")
def top_message_users(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)

    sql = text("""
        SELECT 
            u.user_id,
            u.full_name,
            COUNT(m.message_id) AS total_messages
        FROM users u
        JOIN messages m ON m.sender_id = u.user_id
        GROUP BY u.user_id, u.full_name
        ORDER BY total_messages DESC
        LIMIT 10
    """)

    rows = db.execute(sql).fetchall()
    return [dict(r._mapping) for r in rows]


# ============================
# MATCHES LIST
# ============================
@router.get("/matches")
def admin_matches(
    search: str = "",
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    require_admin(user)

    if search:
        sql = text("""
            SELECT 
                m.match_id,
                m.created_at,
                u1.full_name AS user1_name,
                u2.full_name AS user2_name
            FROM matches m
            JOIN users u1 ON m.user1_id = u1.user_id
            JOIN users u2 ON m.user2_id = u2.user_id
            WHERE u1.full_name LIKE :kw
               OR u2.full_name LIKE :kw
            ORDER BY m.created_at DESC
        """)
        data = db.execute(sql, {"kw": f"%{search}%"}).fetchall()
    else:
        sql = text("""
            SELECT 
                m.match_id,
                m.created_at,
                u1.full_name AS user1_name,
                u2.full_name AS user2_name
            FROM matches m
            JOIN users u1 ON m.user1_id = u1.user_id
            JOIN users u2 ON m.user2_id = u2.user_id
            ORDER BY m.created_at DESC
        """)
        data = db.execute(sql).fetchall()

    return [dict(r._mapping) for r in data]




# ============================
# ALL MESSAGES (admin xem tất cả)
# ============================
@router.get("/messages")
def admin_messages(
    match_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    require_admin(user)

    sql = text("""
        SELECT
            m.message_id,
            m.match_id,
            m.sender_id,
            m.content,
            m.type,
            m.is_read,
            m.created_at,
            sender.full_name AS sender_name,
            receiver.full_name AS receiver_name
        FROM messages m
        JOIN matches mt ON m.match_id = mt.match_id
        JOIN users sender ON sender.user_id = m.sender_id
        JOIN users receiver 
            ON receiver.user_id = 
               CASE 
                 WHEN mt.user1_id = m.sender_id THEN mt.user2_id
                 ELSE mt.user1_id
               END
        WHERE m.match_id = :match_id
        ORDER BY m.created_at ASC
    """)

    rows = db.execute(sql, {"match_id": match_id}).fetchall()

    return [dict(r._mapping) for r in rows]





# ============================
# DELETE MESSAGE
# ============================
@router.delete("/messages/{mid}")
def delete_message(mid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)

    db.execute(
        text("DELETE FROM messages WHERE message_id = :mid"),
        {"mid": mid}
    )
    db.commit()

    return {"message": "Đã xóa tin nhắn"}
