from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth.jwt_handler import verify_access_token
import json
from datetime import datetime

router = APIRouter(prefix="/ws", tags=["WebSocket Call"])

# Lưu kết nối: user_id → WebSocket
call_connections: Dict[int, WebSocket] = {}

# 👇 HÀM HỖ TRỢ: Lưu log vào bảng messages
def save_call_log_message(db: Session, match_id: int, sender_id: int, content: str):
    try:
        db.execute(
            text("""
                INSERT INTO messages (match_id, sender_id, content, type, created_at)
                VALUES (:mid, :sid, :content, 'call_log', NOW())
            """),
            {"mid": match_id, "sid": sender_id, "content": content}
        )
        db.commit()
    except Exception as e:
        print(f"⚠️ Error saving call log: {e}")

@router.websocket("/call/{match_id}")
async def call_signaling(
    websocket: WebSocket, 
    match_id: int, 
    db: Session = Depends(get_db)
):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    payload = verify_access_token(token)
    if not payload:
        await websocket.close(code=403)
        return

    email = payload.get("sub")
    user = db.execute(
        text("SELECT user_id, full_name FROM users WHERE email = :email"),
        {"email": email}
    ).fetchone()

    if not user:
        await websocket.close(code=403)
        return

    user_id = user.user_id
    
    await websocket.accept()
    call_connections[user_id] = websocket
    print(f"📞 User {user_id} connected to call signaling")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            # ✅ 1. Gửi offer
            if msg_type == "call-offer":
                target_id = message.get("target_id")
                call_type = message.get("call_type", "voice")
                
                result = db.execute(
                    text("""
                        INSERT INTO calls (match_id, caller_id, callee_id, call_type, status, started_at)
                        VALUES (:mid, :caller, :callee, :ctype, 'missed', NOW())
                    """),
                    {
                        "mid": match_id, "caller": user_id, "callee": target_id, "ctype": call_type
                    }
                )
                db.commit()
                call_id = result.lastrowid

                if target_id in call_connections:
                    await call_connections[target_id].send_text(json.dumps({
                        "type": "incoming-call",
                        "call_id": call_id,
                        "caller_id": user_id,
                        "caller_name": user.full_name,
                        "call_type": call_type,
                        "offer": message.get("offer")
                    }))

            # ✅ 2. Trả lời
            elif msg_type == "call-answer":
                target_id = message.get("target_id")
                call_id = message.get("call_id")
                
                db.execute(
                    text("UPDATE calls SET status = 'answered' WHERE call_id = :cid"),
                    {"cid": call_id}
                )
                db.commit()

                if target_id in call_connections:
                    await call_connections[target_id].send_text(json.dumps({
                        "type": "call-answered",
                        "answer": message.get("answer")
                    }))

            # ✅ 3. ICE Candidates
            elif msg_type == "ice-candidate":
                target_id = message.get("target_id")
                if target_id in call_connections:
                    await call_connections[target_id].send_text(json.dumps({
                        "type": "ice-candidate",
                        "candidate": message.get("candidate")
                    }))

            # ✅ 4. Từ chối
            elif msg_type == "call-reject":
                target_id = message.get("target_id")
                call_id = message.get("call_id")
                
                db.execute(
                    text("UPDATE calls SET status = 'rejected' WHERE call_id = :cid"),
                    {"cid": call_id}
                )
                db.commit()
                
                save_call_log_message(db, match_id, user_id, "📞 Cuộc gọi bị từ chối")

                if target_id in call_connections:
                    await call_connections[target_id].send_text(json.dumps({
                        "type": "call-rejected"
                    }))

            # ✅ 5. Kết thúc cuộc gọi (ĐÃ SỬA LOGIC TEXT)
            elif msg_type == "call-end":
                target_id = message.get("target_id")
                call_id = message.get("call_id")
                duration = message.get("duration", 0)
                # 👇 Lấy call_type từ client gửi lên
                call_type = message.get("call_type", "voice") 
                
                db.execute(
                    text("""
                        UPDATE calls 
                        SET status = 'ended', ended_at = NOW(), duration = :dur
                        WHERE call_id = :cid
                    """),
                    {"cid": call_id, "dur": duration}
                )
                db.commit()
                
                # 👇 Tạo nội dung log dựa trên loại cuộc gọi
                mins, secs = divmod(int(duration), 60)
                time_str = f"{mins} phút {secs} giây" if mins > 0 else f"{secs} giây"
                
                if call_type == "video":
                    log_content = f"🎥 Cuộc gọi video - {time_str}"
                else:
                    log_content = f"📞 Cuộc gọi thoại - {time_str}"
                
                save_call_log_message(db, match_id, user_id, log_content)

                if target_id in call_connections:
                    await call_connections[target_id].send_text(json.dumps({
                        "type": "call-ended",
                        "call_type": call_type # Gửi lại type cho bên kia biết
                    }))

    except WebSocketDisconnect:
        if user_id in call_connections:
            del call_connections[user_id]
        print(f"📵 User {user_id} disconnected from call")