from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth.jwt_handler import verify_access_token
import json

router = APIRouter(prefix="/ws", tags=["WebSocket Chat"])

# match_id → list[{"ws": WebSocket, "user_id": int}]
active_connections: Dict[int, List[dict]] = {}

# ----------------------------- #
#  KẾT NỐI / NGẮT KẾT NỐI
# ----------------------------- #
async def connect_client(match_id: int, websocket: WebSocket, user_id: int):
    """Thêm client vào danh sách kết nối"""
    await websocket.accept()
    if match_id not in active_connections:
        active_connections[match_id] = []
    active_connections[match_id].append({"ws": websocket, "user_id": user_id})
    print(f"🔌 Client {user_id} joined match {match_id}. Total: {len(active_connections[match_id])}")


def remove_client(match_id: int, websocket: WebSocket):
    """Xoá client khi ngắt kết nối"""
    if match_id in active_connections:
        active_connections[match_id] = [
            c for c in active_connections[match_id] if c["ws"] != websocket
        ]
        if not active_connections[match_id]:
            del active_connections[match_id]
    print(f"❌ Client left match {match_id}")


async def broadcast_message(match_id: int, message: dict):
    """Gửi tin nhắn tới tất cả client trong match"""
    if match_id in active_connections:
        for conn in active_connections[match_id]:
            try:
                # Gắn cờ "is_me" để phân biệt bên gửi / nhận
                message["is_me"] = conn["user_id"] == message["sender_id"]
                await conn["ws"].send_text(json.dumps(message))
            except Exception as e:
                print(f"⚠️ Send error: {e}")

# 👇 HÀM TẠO THÔNG BÁO (MỚI)
def create_message_notification(db: Session, sender_id: int, receiver_id: int, content: str):
    try:
        # Tạo nội dung ngắn gọn
        preview = content[:30] + "..." if len(content) > 30 else content
        notif_content = f"📩 Bạn có tin nhắn mới: {preview}"
        
        db.execute(
            text("""
                INSERT INTO notifications (user_id, from_user_id, type, content, created_at)
                VALUES (:uid, :from_id, 'message', :content, NOW())
            """),
            {
                "uid": receiver_id,       
                "from_id": sender_id,     
                "content": notif_content
            }
        )
        db.commit()
    except Exception as e:
        print(f"⚠️ Lỗi tạo thông báo: {e}")


# ----------------------------- #
#  ROUTE WEBSOCKET CHÍNH
# ----------------------------- #
@router.websocket("/chat/{match_id}")
async def chat_ws(websocket: WebSocket, match_id: int, db: Session = Depends(get_db)):
    # ✅ Lấy token
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    # ✅ Xác thực token
    payload = verify_access_token(token)
    if not payload:
        await websocket.close(code=403)
        return

    email = payload.get("sub")
    user = db.execute(
        text("SELECT user_id, full_name FROM users WHERE email = :email"),
        {"email": email},
    ).fetchone()

    if not user:
        await websocket.close(code=403)
        return

    # ✅ Tìm người nhận (Partner ID) để gửi thông báo
    match_info = db.execute(
        text("SELECT user1_id, user2_id FROM matches WHERE match_id = :mid"),
        {"mid": match_id}
    ).fetchone()
    
    if not match_info:
        await websocket.close(code=4004)
        return

    partner_id = match_info.user2_id if match_info.user1_id == user.user_id else match_info.user1_id

    # ✅ Cho phép kết nối
    await connect_client(match_id, websocket, user.user_id)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            content = payload.get("content", "").strip()
            msg_type = payload.get("type", "text")

            if not content:
                continue

            # ✅ 1. Lưu tin nhắn vào DB
            db.execute(
                text("""
                    INSERT INTO messages (match_id, sender_id, content, type)
                    VALUES (:mid, :sid, :content, :type)
                """),
                {"mid": match_id, "sid": user.user_id, "content": content, "type": msg_type},
            )
            db.commit()

            # ✅ 2. Tạo thông báo cho người nhận (MỚI)
            # (Chỉ tạo nếu là tin nhắn thường, không phải log hệ thống)
            if msg_type != "call_log":
                create_message_notification(db, user.user_id, partner_id, content)

            # ✅ 3. Gửi realtime
            message_data = {
                "sender_id": user.user_id,
                "sender_name": user.full_name,
                "content": content,
                "type": msg_type,
                "created_at": str(datetime.now()) # Thêm thời gian cho chuẩn
            }
            await broadcast_message(match_id, message_data)

    except WebSocketDisconnect:
        remove_client(match_id, websocket)
    except Exception as e:
        print(f"Error: {e}")
        remove_client(match_id, websocket)
from datetime import datetime # Import thêm cái này ở đầu file nếu thiếu