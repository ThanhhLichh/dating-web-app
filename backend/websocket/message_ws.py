from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth.jwt_handler import verify_access_token  # ✅ đổi đúng hàm xác thực JWT
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


# ----------------------------- #
#  ROUTE WEBSOCKET CHÍNH
# ----------------------------- #
@router.websocket("/chat/{match_id}")
async def chat_ws(websocket: WebSocket, match_id: int, db: Session = Depends(get_db)):
    # ✅ Lấy token từ query string (frontend gửi ?token=...)
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
    if not email:
        await websocket.close(code=403)
        return

    # ✅ Lấy user từ DB theo email
    user = db.execute(
        text("SELECT user_id, full_name FROM users WHERE email = :email"),
        {"email": email},
    ).fetchone()

    if not user:
        await websocket.close(code=403)
        return

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

            # ✅ Lưu vào DB
            db.execute(
                text("""
                    INSERT INTO messages (match_id, sender_id, content, type)
                    VALUES (:mid, :sid, :content, :type)
                """),
                {"mid": match_id, "sid": user.user_id, "content": content, "type": msg_type},
            )
            db.commit()

            # ✅ Gửi realtime tới các client cùng match
            message_data = {
                "sender_id": user.user_id,
                "sender_name": user.full_name,
                "content": content,
                "type": msg_type,
            }
            await broadcast_message(match_id, message_data)

    except WebSocketDisconnect:
        remove_client(match_id, websocket)
