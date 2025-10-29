from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET_KEY = "supersecretkey"  # ⚠️ Đặt key mạnh hơn khi deploy thật
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 tiếng

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
def decode_token(token: str):
    """
    Giải mã JWT token để lấy payload (dùng cho WebSocket)
    """
    payload = verify_access_token(token)
    if not payload:
        raise JWTError("Invalid or expired token")
    return payload
