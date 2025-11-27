from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class Event(Base):
    __tablename__ = "events"

    event_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(String(255))
    start_time = Column(DateTime)
    image_url = Column(String(255))
    max_participants = Column(Integer, default=50)
    
    # 👇 CÁC CỘT MỚI
    status = Column(String(20), default="pending") # pending, approved, rejected
    creator_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, server_default=func.now())