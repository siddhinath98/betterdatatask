from fastapi.testclient import TestClient
from database import get_db, Base, engine
from app.models.file import File as FileModel
from main import app
import pytest

# Setup test client
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create test data
    db = next(get_db())
    test_files = [
        FileModel(filename="test1.txt", url="https://bucket.s3.region.amazonaws.com/uuid/test1.txt"),
        FileModel(filename="test2.txt", url="https://bucket.s3.region.amazonaws.com/uuid/test2.txt"),
        FileModel(filename="test3.txt", url="https://bucket.s3.region.amazonaws.com/uuid/test3.txt")
    ]
    db.bulk_save_objects(test_files)
    db.commit()
    
    yield
    
    # Cleanup
    Base.metadata.drop_all(bind=engine)

def test_list_files_count():
    # Get response from API
    response = client.get("/files")
    assert response.status_code == 200
    
    # Get files directly from database
    db = next(get_db())
    db_files = db.query(FileModel).all()
    
    # Compare counts
    assert len(response.json()) == len(db_files) 