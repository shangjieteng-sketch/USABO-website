#!/bin/bash

# S3 Setup Script for Large Files
set -e

BUCKET_NAME="usabo-website-assets"
REGION="us-east-1"

echo "🪣 Setting up S3 bucket for large files..."

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION || echo "Bucket might already exist"

# Enable public read access for static files
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'$BUCKET_NAME'/public/*"
        }
    ]
}'

# Upload PPT files if they exist
if [ -d "public/ppt" ]; then
    echo "📤 Uploading PPT files to S3..."
    aws s3 sync public/ppt/ s3://$BUCKET_NAME/public/ppt/ --acl public-read
fi

# Upload PDF files if they exist
if [ -d "PDF" ]; then
    echo "📤 Uploading PDF files to S3..."
    aws s3 sync PDF/ s3://$BUCKET_NAME/public/pdf/ --acl public-read
fi

echo "✅ S3 setup complete!"
echo "🌐 Files available at: https://$BUCKET_NAME.s3.$REGION.amazonaws.com/public/"