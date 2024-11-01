class MockUploadClient:
    def get_presigned_multipart(self, key, content_type, file_size, chunk_size):
        return {
            "upload_id": "mock_upload_id",
            "key": key,
            "fields": {
                "Content-Type": content_type,
                "key": key
            }
        }

    def complete_multipart_upload(self, key, upload_id, etags):
        return {
            "Location": f"https://mock-bucket.s3.amazonaws.com/{key}"
        }

    def generate_presigned_url(self, key):
        return f"https://mock-presigned-url/{key}"
