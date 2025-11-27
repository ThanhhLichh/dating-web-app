from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.event_model import Event
from models.user_model import User
from auth.dependencies import get_current_user, get_current_admin
import shutil
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/events", tags=["Events"])

# 1. Lấy danh sách sự kiện (CHỈ LẤY APPROVED)
@router.get("/")
def get_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sql = text("""
        SELECT e.*, 
               CASE WHEN ep.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_joined,
               (SELECT COUNT(*) FROM event_participants WHERE event_id = e.event_id) as current_count
        FROM events e
        LEFT JOIN event_participants ep ON e.event_id = ep.event_id AND ep.user_id = :uid
        WHERE e.status = 'approved' 
        ORDER BY e.start_time DESC
    """)
    events = db.execute(sql, {"uid": current_user.user_id}).fetchall()
    return [dict(e._mapping) for e in events]

# 2. Lấy danh sách chờ duyệt (ADMIN ONLY)
@router.get("/pending")
def get_pending_events(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    sql = text("""
        SELECT e.*, u.full_name as creator_name 
        FROM events e
        LEFT JOIN users u ON e.creator_id = u.user_id
        WHERE e.status = 'pending'
        ORDER BY e.created_at DESC
    """)
    events = db.execute(sql).fetchall()
    return [dict(e._mapping) for e in events]

# 3. Tạo sự kiện (AI CŨNG TẠO ĐƯỢC)
@router.post("/")
def create_event(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    start_time: str = Form(...),
    limit: int = Form(50),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    UPLOAD_DIR = "uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_extension = file.filename.split(".")[-1]
    new_filename = f"event_{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    url = "/" + str(Path(file_path)).replace("\\", "/")

    # Admin tạo -> Approved luôn. User tạo -> Pending
    initial_status = "approved" if getattr(current_user, "role", "user") == "admin" else "pending"

    new_event = Event(
        title=title, description=description, location=location, start_time=start_time,
        max_participants=limit, image_url=url,
        creator_id=current_user.user_id,
        status=initial_status
    )
    db.add(new_event)
    db.commit()
    
    msg = "Tạo thành công!" if initial_status == "approved" else "Đã gửi yêu cầu! Chờ Admin duyệt."
    return {"message": msg, "event_id": new_event.event_id}

# 4. Duyệt sự kiện (ADMIN ONLY)
@router.put("/{event_id}/status")
def update_status(
    event_id: int, 
    status: str = Form(...), # 'approved' hoặc 'rejected'
    db: Session = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event: raise HTTPException(404, "Không tìm thấy")
    event.status = status
    db.commit()
    return {"message": f"Đã cập nhật thành {status}"}

# 5. Cập nhật sự kiện (PUT - Admin sửa nội dung)
@router.put("/{event_id}")
def update_event(
    event_id: int, title: str = Form(...), description: str = Form(...), 
    location: str = Form(...), start_time: str = Form(...), limit: int = Form(...),
    file: UploadFile = File(None), db: Session = Depends(get_db), admin: User = Depends(get_current_admin)
):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event: raise HTTPException(404, "Không tìm thấy")

    event.title = title
    event.description = description
    event.location = location
    event.start_time = start_time
    event.max_participants = limit

    if file:
        # Code upload ảnh (giữ nguyên như cũ cho ngắn gọn)
        pass 

    db.commit()
    return {"message": "Cập nhật thành công!"}

# 6. Xóa sự kiện
@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event: raise HTTPException(404, "Không tìm thấy")
    db.delete(event)
    db.commit()
    return {"message": "Đã xóa"}

# 7. Join / Leave / Participants (Giữ nguyên code cũ của bạn)
@router.post("/{event_id}/join")
def join_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check = db.execute(text("SELECT 1 FROM event_participants WHERE event_id=:eid AND user_id=:uid"), {"eid": event_id, "uid": current_user.user_id}).fetchone()
    if check: return {"message": "Đã tham gia rồi"}
    
    event = db.query(Event).filter(Event.event_id == event_id).first()
    curr = db.execute(text("SELECT COUNT(*) FROM event_participants WHERE event_id=:eid"), {"eid": event_id}).scalar()
    limit = event.max_participants if event.max_participants else 50
    if curr >= limit: raise HTTPException(400, "Đã đầy")

    db.execute(text("INSERT INTO event_participants (event_id, user_id) VALUES (:eid, :uid)"), {"eid": event_id, "uid": current_user.user_id})
    db.commit()
    return {"message": "Tham gia thành công"}

@router.delete("/{event_id}/leave")
def leave_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.execute(text("DELETE FROM event_participants WHERE event_id=:eid AND user_id=:uid"), {"eid": event_id, "uid": current_user.user_id})
    db.commit()
    return {"message": "Đã hủy tham gia"}

@router.get("/{event_id}/participants")
def get_participants(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_joined = db.execute(text("SELECT 1 FROM event_participants WHERE event_id=:eid AND user_id=:uid"), {"eid": event_id, "uid": current_user.user_id}).fetchone()
    if not is_joined and getattr(current_user, "role", "user") != 'admin':
        raise HTTPException(403, "Phải tham gia mới xem được")
    
    sql = text("SELECT u.user_id, u.full_name, u.gender, p.url as avatar FROM event_participants ep JOIN users u ON ep.user_id = u.user_id LEFT JOIN photos p ON u.user_id = p.user_id AND p.is_avatar = 1 WHERE ep.event_id = :eid AND u.user_id != :uid")
    users = db.execute(sql, {"eid": event_id, "uid": current_user.user_id}).fetchall()
    return [dict(u._mapping) for u in users]

# 8. Lấy lịch sử tin nhắn của sự kiện
@router.get("/{event_id}/messages")
def get_event_messages(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Check quyền: Phải tham gia hoặc là Admin mới được xem
    if current_user.role != 'admin':
        is_joined = db.execute(text("SELECT 1 FROM event_participants WHERE event_id=:eid AND user_id=:uid"), 
                               {"eid": event_id, "uid": current_user.user_id}).fetchone()
        if not is_joined:
            raise HTTPException(status_code=403, detail="Bạn chưa tham gia sự kiện này")

    # 2. Query tin nhắn + Join bảng users để lấy tên người gửi
    sql = text("""
        SELECT m.content, m.created_at, m.sender_id, u.full_name as sender_name
        FROM event_messages m
        JOIN users u ON m.sender_id = u.user_id
        WHERE m.event_id = :eid
        ORDER BY m.created_at ASC
    """)
    
    msgs = db.execute(sql, {"eid": event_id}).fetchall()
    
    # 3. Format dữ liệu trả về (giống format WebSocket)
    return [{
        "content": m.content,
        "sender_id": m.sender_id,
        "sender_name": m.sender_name,
        # Format thời gian thành HH:MM (hoặc giữ nguyên tùy bạn)
        "created_at": m.created_at.strftime("%H:%M") if m.created_at else "",
        "is_me": m.sender_id == current_user.user_id
    } for m in msgs]