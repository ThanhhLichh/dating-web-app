from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from database import get_db
from models.user_model import User
from auth.jwt_handler import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# 1. Hàm lấy user hiện tại (User thường)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Phiên đăng nhập đã hết hạn hoặc không hợp lệ",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        # Nếu token lỗi/hết hạn -> Set user offline (Logic cũ của bạn)
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
            email = decoded.get("sub")
            if email:
                db.query(User).filter(User.email == email).update({"is_online": 0})
                db.commit()
        except Exception:
            pass
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    # 🚫🚫🚫 CHẶN USER ĐÃ BỊ BAN — THÊM PHẦN NÀY 🚫🚫🚫
    if getattr(user, "is_banned", 0) == 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa bởi admin."
        )

    return user


# 2. Hàm kiểm tra quyền Admin
def get_current_admin(current_user: User = Depends(get_current_user)):
    if getattr(current_user, "role", "user") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập quản trị viên (Admin only)"
        )
    return current_user
