from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.user_model import User
from auth.dependencies import get_current_user
from datetime import date

router = APIRouter(prefix="/home", tags=["Home"])

# ✅ API: Lấy người gợi ý (có hỗ trợ bộ lọc)
@router.get("/recommendations")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    gender: str = Query(None),
    min_age: int = Query(18),
    max_age: int = Query(60),
    city: str = Query(None),
    interest: str = Query(None),
):
    today = date.today()

    # ✅ Giới hạn tuổi an toàn
    if min_age < 18:
        min_age = 18
    if max_age > 60:
        max_age = 60
    if min_age > max_age:
        raise HTTPException(status_code=400, detail="Độ tuổi không hợp lệ")

    # Tính ngày sinh để lọc
    min_birth = today.replace(year=today.year - max_age)
    max_birth = today.replace(year=today.year - min_age)

    where_clauses = [
        "u.user_id != :uid",
        "u.user_id NOT IN (SELECT to_user_id FROM likes WHERE from_user_id = :uid)",
        "u.user_id NOT IN (SELECT target_user_id FROM skips WHERE user_id = :uid)",
        "u.birthday BETWEEN :min_birth AND :max_birth",
    ]
    params = {"uid": current_user.user_id, "min_birth": min_birth, "max_birth": max_birth}

    if gender:
        where_clauses.append("u.gender = :gender")
        params["gender"] = gender

    if city:
        where_clauses.append("u.city LIKE :city")
        params["city"] = f"%{city}%"

    if interest:
        where_clauses.append("""
            u.user_id IN (
                SELECT ui.user_id FROM user_interests ui
                JOIN interests i ON i.interest_id = ui.interest_id
                WHERE i.name LIKE :interest
            )
        """)
        params["interest"] = f"%{interest}%"

    where_sql = " AND ".join(where_clauses)

    # ✅ Tổng số người phù hợp
    total_sql = text(f"""
        SELECT COUNT(*) as total
        FROM users u
        WHERE {where_sql}
    """)
    total_result = db.execute(total_sql, params).fetchone()
    total = total_result.total if total_result else 0

    # ✅ Lấy 1 người ngẫu nhiên phù hợp
    sql = text(f"""
        SELECT u.user_id, u.full_name, u.gender, u.city, u.bio, u.birthday, 
               p.url AS avatar_url
        FROM users u
        LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_avatar = 1
        WHERE {where_sql}
        ORDER BY RAND()
        LIMIT 1
    """)
    result = db.execute(sql, params).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Không còn người nào phù hợp!")

    # ✅ Đếm đã xem (đã skip)
    seen_sql = text("SELECT COUNT(*) as seen FROM skips WHERE user_id = :uid")
    seen_result = db.execute(seen_sql, {"uid": current_user.user_id}).fetchone()
    seen = seen_result.seen if seen_result else 0
    index = min(seen + 1, total) if total > 0 else 0

    # ✅ Trả kết quả
    user_data = dict(result._mapping)
    return {"user": user_data, "total": total, "index": index}

    if target_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Không thể thích chính mình")

    check = db.execute(text("""
        SELECT 1 FROM likes WHERE from_user_id = :uid AND to_user_id = :tid
    """), {"uid": current_user.user_id, "tid": target_id}).fetchone()

    if check:
        raise HTTPException(status_code=400, detail="Bạn đã thích người này rồi")

    db.execute(text("""
        INSERT INTO likes (from_user_id, to_user_id)
        VALUES (:uid, :tid)
    """), {"uid": current_user.user_id, "tid": target_id})
    db.commit()

    return {"message": "Đã thích người này!"}


# ❌ Bỏ qua người dùng khác
@router.post("/{target_id}/skip")
def skip_user(target_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if target_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Không thể bỏ qua chính mình")

    check = db.execute(text("""
        SELECT 1 FROM skips WHERE user_id = :uid AND target_user_id = :tid
    """), {"uid": current_user.user_id, "tid": target_id}).fetchone()

    if check:
        raise HTTPException(status_code=400, detail="Đã bỏ qua người này rồi")

    db.execute(text("""
        INSERT INTO skips (user_id, target_user_id)
        VALUES (:uid, :tid)
    """), {"uid": current_user.user_id, "tid": target_id})
    db.commit()

    return {"message": "Đã bỏ qua người này!"}


# 📌 Lấy danh sách người đã bỏ qua
@router.get("/skipped")
def get_skipped_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sql = text("""
        SELECT u.user_id, u.full_name,
               p.url AS avatar
        FROM skips s
        JOIN users u ON s.target_user_id = u.user_id
        LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_avatar = 1
        WHERE s.user_id = :uid
        ORDER BY s.created_at DESC
    """)

    rows = db.execute(sql, {"uid": current_user.user_id}).fetchall()

    return [dict(r._mapping) for r in rows]


# ♻️ Gỡ skip (cho người đó quay lại recommendation)
@router.delete("/skipped/{target_id}")
def undo_skip_user(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check = db.execute(text("""
        SELECT 1 FROM skips 
        WHERE user_id = :uid AND target_user_id = :tid
    """), {"uid": current_user.user_id, "tid": target_id}).fetchone()

    if not check:
        raise HTTPException(status_code=404, detail="Người này không nằm trong danh sách đã bỏ qua")

    db.execute(text("""
        DELETE FROM skips 
        WHERE user_id = :uid AND target_user_id = :tid
    """), {"uid": current_user.user_id, "tid": target_id})

    db.commit()

    return {"message": "Đã gỡ khỏi danh sách skip!"}



# ❤️ Thích người dùng khác
@router.post("/{target_id}/like")
def like_user(target_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if target_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Không thể thích chính mình")

    # Kiểm tra đã like chưa
    check = db.execute(text("""
        SELECT * FROM likes 
        WHERE from_user_id = :uid AND to_user_id = :tid
    """), {"uid": current_user.user_id, "tid": target_id}).fetchone()

    if check:
        raise HTTPException(status_code=400, detail="Bạn đã thích người này rồi")

    # ✅ Thêm vào bảng likes
    db.execute(text("""
        INSERT INTO likes (from_user_id, to_user_id)
        VALUES (:uid, :tid)
    """), {"uid": current_user.user_id, "tid": target_id})

    # ✅ Thêm thông báo cho người bị thích
    db.execute(text("""
        INSERT INTO notifications (user_id, from_user_id, type, content, is_read)
        VALUES (:to_user, :from_user, 'like', :content, 0)
    """), {
        "to_user": target_id,
        "from_user": current_user.user_id,
        "content": f"{current_user.full_name} đã thích bạn 💖"
    })

    # ✅ Kiểm tra xem người kia có thích lại chưa (match)
    match_check = db.execute(text("""
        SELECT * FROM likes
        WHERE from_user_id = :tid AND to_user_id = :uid
    """), {"uid": current_user.user_id, "tid": target_id}).fetchone()

    if match_check:
        # Nếu cả hai cùng thích nhau → tạo match
        db.execute(text("""
            INSERT INTO matches (user1_id, user2_id, status)
            VALUES (:u1, :u2, 'active')
        """), {"u1": current_user.user_id, "u2": target_id})

        # Gửi thông báo match cho cả hai
        db.execute(text("""
            INSERT INTO notifications (user_id, from_user_id, type, content)
            VALUES (:u1, :u2, 'match', :msg1),
                   (:u2, :u1, 'match', :msg2)
        """), {
            "u1": current_user.user_id,
            "u2": target_id,
            "msg1": f"Bạn đã match với {target_id}! 💞",
            "msg2": f"Bạn đã match với {current_user.full_name}! 💞"
        })

    db.commit()
    return {"message": "Đã thích người này!"}

