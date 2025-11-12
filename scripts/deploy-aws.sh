#!/bin/bash

# AWS Deployment Script for USABO Website
set -e

echo "🚀 Starting AWS deployment..."

# Check if AWS CLI and EB CLI are installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   npm install -g aws-cli"
    exit 1
fi

if ! command -v eb &> /dev/null; then
    echo "❌ EB CLI not found. Please install it first:"
    echo "   pip install awsebcli"
    exit 1
fi

# Create application if it doesn't exist
echo "📦 Creating/updating Elastic Beanstalk application..."
eb init --platform "Node.js 18 running on 64bit Amazon Linux 2023" --region us-east-1

# Create environment if it doesn't exist
if ! eb status 2>/dev/null; then
    echo "🏗️  Creating new environment..."
    eb create usabo-website-prod --instance-type t3.micro
else
    echo "🔄 Deploying to existing environment..."
    eb deploy
fi

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at the URL shown above."