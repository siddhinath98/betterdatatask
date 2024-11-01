### Setup
```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```


### ENV Vars
Create a .env file in your root directory with the following contents. Update the values to match your config.

```
AWS_BUCKET_NAME=YOUR_BUCKET_NAME
AWS_REGION=YOUR_REGION_NAME
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
```

### Run Server
```
uvicorn main:app --reload
```


### AWS Setup
- name bucket
- enabled ACLs
- set object writer
- disable block public access
- enable transfer acceleration (optional and not used in example)


#### AWS Permissions

Bucket Policy
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowUserAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:{your iam arn}"
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::your_bucket_name/*",
                "arn:aws:s3:::your_bucket_name"
            ]
        }
    ]
}
```


CORS Settings
```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ]
    }
]
```