from pydantic import BaseModel
from datetime import datetime

class GetFile(BaseModel):
    id: int
    filename: str
    url: str
    created_at: datetime

    class Config:
        from_attributes = True  # This allows Pydantic to work with SQLAlchemy models 