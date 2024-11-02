####Problem statement:
Create a file uploader module that can upload files to s3 and store the file metadata in a database.
It should be able to upload files in chunks and resume from where it left off in case of a failure.
It should have a preview and download feature for the uploaded files.

####Approach 1 :
Upload the file to backend from frontend.
Then let backend handle the file upload to s3 and store the file metadata in database.

####Approach 2 :
Upload the file to s3 from frontend directly.
Use presigned url for uploading the file to s3.
Upload files in chunks to s3 using presigned url.
Then let backend handle the file upload to s3 and store the file metadata in database.

###Final decision :
I will go with approach 2.
Because it will be more robust and as mentioned in the brownie points to handle large files,
This will be the best way to handle upload of large files as we will not be required to transfer the file twice from frontend to backend and then to s3.
Saving a lot of network bandwidth and time.
