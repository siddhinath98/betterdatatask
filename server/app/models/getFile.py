from datetime import datetime
from pydantic import BaseModel

class GetFile(BaseModel):
    filename: str
    url: str
    created_at: datetime