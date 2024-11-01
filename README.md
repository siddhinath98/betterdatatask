### ENV Vars

Create a .env file in your server directory with the following contents. Update the values to match your config.

```
AWS_BUCKET_NAME=YOUR_BUCKET_NAME
AWS_REGION=YOUR_REGION_NAME
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
DATABASE_URL=YOUR_DATABASE_URL
```

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

#### Run project

```
ensure you have docker installed and running
navigate to the root folder
run `docker compose up --build`

```
