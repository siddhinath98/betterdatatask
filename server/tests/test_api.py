import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from app.models.file import File as FileModel

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_start_upload():
    response = client.post(
        "/start-upload",
        json={
            "file_name": "test.txt",
            "content_type": "text/plain",
            "file_size": 1024
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "upload_id" in data
    assert "key" in data
    assert "fields" in data  
    
def test_complete_upload():
    # First start an upload
    start_response = client.post(
        "/start-upload",
        json={
            "file_name": "test.txt",
            "content_type": "text/plain",
            "file_size": 1024
        }
    )
    assert start_response.status_code == 200
    start_data = start_response.json()
    
    # Then complete it
    response = client.post(
        "/complete-upload",
        json={
            "key": start_data["key"],
            "upload_id": start_data["upload_id"],
            "etags": ["etag1"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "Location" in data

def test_list_files():
    try:
        # Get a database session
        db = TestingSessionLocal()
        
        # Create a test file record
        test_file = FileModel(
            filename="test.txt",
            url="https://test-bucket.s3.amazonaws.com/test.txt"
        )
        db.add(test_file)
        db.commit()
        db.refresh(test_file)
        
        # Make the API call
        response = client.get("/files")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["filename"] == "test.txt"
        assert "url" in data[0]
        assert "created_at" in data[0]
        
    finally:
        # Clean up
        db.close()
