from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class EventMessage(Base):
    __tablename__ = "event_messages"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.event_id"))
    sender_id = Column(Integer, ForeignKey("users.user_id"))
    content = Column(Text)
    type = Column(String(10), default="text")
    created_at = Column(DateTime, server_default=func.now())