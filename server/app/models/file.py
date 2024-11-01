from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow) 