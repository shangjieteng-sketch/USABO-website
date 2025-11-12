# AWS Deployment Guide

## Prerequisites

1. Install AWS CLI:
   ```bash
   curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
   sudo installer -pkg AWSCLIV2.pkg -target /
   ```

2. Install EB CLI:
   ```bash
   pip install awsebcli
   ```

3. Configure AWS credentials:
   ```bash
   aws configure
   ```

## Quick Deployment

1. **Deploy to Elastic Beanstalk:**
   ```bash
   npm run deploy:aws
   ```

2. **Set up S3 for large files (optional):**
   ```bash
   npm run setup:s3
   ```

## Manual Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and update:
- Update OAuth callback URLs to your AWS domain
- Set `PORT=8080` for Elastic Beanstalk
- Add AWS S3 bucket configuration

### 2. Deploy Application

```bash
# Initialize Elastic Beanstalk
eb init --platform "Node.js 18 running on 64bit Amazon Linux 2023" --region us-east-1

# Create environment
eb create usabo-website-prod --instance-type t3.micro

# Deploy updates
eb deploy
```

### 3. Set Environment Variables in AWS

```bash
eb setenv JWT_SECRET="your-jwt-secret" SESSION_SECRET="your-session-secret"
eb setenv GOOGLE_CLIENT_ID="your-google-client-id" GOOGLE_CLIENT_SECRET="your-google-client-secret"
# ... add other environment variables
```

## Cost Optimization

- **t3.micro instance**: Free tier eligible
- **Application Load Balancer**: ~$16/month
- **S3 storage**: ~$0.023/GB/month
- **Data transfer**: First 1GB free, then $0.09/GB

## Monitoring

View logs:
```bash
eb logs
```

Check health:
```bash
eb health
```

## Scaling

Update instance type:
```bash
eb config
```

## Cleanup

To avoid charges:
```bash
eb terminate usabo-website-prod
```