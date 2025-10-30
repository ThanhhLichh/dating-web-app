from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from database import get_db
from sqlalchemy.orm import Session
from models.user_model import User
from auth.jwt_handler import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

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
        # ✅ Nếu token hết hạn hoặc lỗi → tìm user theo token cũ và set offline
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
            email = decoded.get("sub")
            if email:
                db.query(User).filter(User.email == email).update({"is_online": 0})
                db.commit()
        except Exception:
            pass
        raise credentials_exception

    # ✅ Tìm user
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    return user
