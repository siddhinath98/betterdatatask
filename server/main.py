from email.utils import unquote
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
from app.models.fileUploads import (
    StartUploadPayload,
    StartUploadResponse,
    CompleteUploadPayload,
    CompleteUploadResponse,
)
from sqlalchemy.orm import Session
from database import get_db, engine, Base  
from app.models.file import File as FileModel
from app.models.fileResponse import GetFile
from typing import List

from app.services.upload import UploadClient
import uuid
from config import Config
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = UploadClient()

# Create tables
Base.metadata.create_all(bind=engine)


@app.get("/")
async def index():
    return FileResponse("index.html")


@app.post("/start-upload")
async def start_upload(payload: StartUploadPayload) -> StartUploadResponse:

    key = f"{uuid.uuid4()}/{payload.file_name}"

    return client.get_presigned_multipart(
        key,
        payload.content_type,
        payload.file_size,
        chunk_size=10000 * 1024, 
    )


@app.post("/complete-upload")
async def complete_upload(
    payload: CompleteUploadPayload,
    db: Session = Depends(get_db)
) -> CompleteUploadResponse:

    result = client.complete_multipart_upload(
        payload.key, payload.upload_id, payload.etags
    )

    filename = unquote(payload.key.split('/', 1)[1])
    s3_url = f"https://{Config.AWS_BUCKET_NAME}.s3.{Config.AWS_REGION}.amazonaws.com/{payload.key}"
    
    # Create database entry
    db_file = FileModel(
        filename=filename,
        url=s3_url
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return CompleteUploadResponse(url=result["Location"])


@app.get("/files", response_model=List[GetFile])
async def list_files(db: Session = Depends(get_db)):
    files = db.query(FileModel).all()
    
    for file in files:
        # Extract key from the full S3 URL
        try:
            url = unquote(file.url)
            key = url.split('.amazonaws.com/')[1]
        except IndexError:
            # If URL is in a different format, try alternative parsing
            key = file.url.split(f"{Config.AWS_BUCKET_NAME}/")[-1]
        
        file.url = client.generate_presigned_url(key)
    
    return files
