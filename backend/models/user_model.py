from sqlalchemy import Column, Integer, String, Boolean, Enum, Date, Text, DateTime
from sqlalchemy.sql import func
from database import Base
import enum

class GenderEnum(enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(10), default="user")
    gender = Column(Enum(GenderEnum), nullable=False)
    birthday = Column(Date)
    job = Column(String(100))
    city = Column(String(100))
    bio = Column(Text)
    height = Column(String(10))
    is_online = Column(Boolean, default=False)

    # ⭐️ Thêm 2 trường quản trị
    is_admin = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
