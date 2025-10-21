from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    gender: str
    birthday: Optional[date] = None
    job: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    height: Optional[str] = None

class UserResponse(BaseModel):
    user_id: int
    email: EmailStr
    full_name: str
    gender: str
    job: Optional[str]
    city: Optional[str]
    bio: Optional[str]
    height: Optional[str]

    class Config:
        orm_mode = True
