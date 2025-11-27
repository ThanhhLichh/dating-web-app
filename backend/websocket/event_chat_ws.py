from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth.jwt_handler import verify_access_token
import json
from datetime import datetime
from models.event_message_model import EventMessage # 👈 Import Model tin nhắn

router = APIRouter(prefix="/ws", tags=["Event Chat"])

# Lưu kết nối: event_id -> List[{ws, user_id, full_name}]
event_connections: Dict[int, List[dict]] = {}

async def broadcast_event_message(event_id: int, message: dict):
    if event_id in event_connections:
        for conn in event_connections[event_id]:
            try:
                # Đánh dấu tin nhắn của chính mình để frontend hiển thị (me/other)
                msg_to_send = {**message, "is_me": conn["user_id"] == message["sender_id"]}
                await conn["ws"].send_text(json.dumps(msg_to_send))
            except:
                pass

@router.websocket("/event-chat/{event_id}")
async def event_chat_endpoint(websocket: WebSocket, event_id: int, db: Session = Depends(get_db)):
    # 1. Xác thực Token
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4003)
        return

    payload = verify_access_token(token)
    if not payload:
        await websocket.close(code=4003)
        return

    email = payload.get("sub")
    user = db.execute(text("SELECT user_id, full_name, role FROM users WHERE email=:e"), {"e": email}).fetchone()
    
    if not user:
        await websocket.close(code=4003)
        return

    # 2. Kiểm tra quyền: Phải tham gia sự kiện hoặc là Admin
    if user.role != 'admin':
        is_joined = db.execute(text("SELECT 1 FROM event_participants WHERE event_id=:eid AND user_id=:uid"), 
                               {"eid": event_id, "uid": user.user_id}).fetchone()
        if not is_joined:
            await websocket.close(code=4003)
            return

    # 3. Chấp nhận kết nối
    await websocket.accept()
    
    if event_id not in event_connections:
        event_connections[event_id] = []
    
    event_connections[event_id].append({
        "ws": websocket, 
        "user_id": user.user_id,
        "full_name": user.full_name
    })

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            content = payload.get("content", "").strip()
            
            if not content: continue

            # ✅ A. LƯU TIN NHẮN VÀO DATABASE
            new_msg = EventMessage(
                event_id=event_id,
                sender_id=user.user_id,
                content=content,
                type="text"
            )
            db.add(new_msg)
            db.commit() # Commit để lưu và lấy thời gian tạo (created_at)

            # ✅ B. CHUẨN BỊ DỮ LIỆU GỬI ĐI
            message_data = {
                "type": "text",
                "content": content,
                "sender_id": user.user_id,
                "sender_name": user.full_name,
                # Format giờ phút (HH:MM)
                "created_at": datetime.now().strftime("%H:%M"), 
                "avatar": "" 
            }

            # ✅ C. GỬI CHO TẤT CẢ (BROADCAST)
            await broadcast_event_message(event_id, message_data)

    except WebSocketDisconnect:
        if event_id in event_connections:
            event_connections[event_id] = [c for c in event_connections[event_id] if c["ws"] != websocket]
    except Exception as e:
        print(f"Error event chat: {e}")