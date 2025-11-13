# 📊 Google Analytics Setup Guide

## Overview
Your website now has Google Analytics 4 tracking with automated email reports sent to `tengshangjie00@gmail.com` every 2 days at midnight.

## ✅ What's Already Done
- ✅ Google Analytics tracking code added to website
- ✅ Automated email reporting system created
- ✅ Email reports scheduled every 2 days at midnight
- ✅ Beautiful HTML email templates with visitor metrics

## 🔧 What You Need to Configure

### 1. Create Google Analytics Property
1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Create Account" → "Account name": `USABO Website`
4. Create a Property → "Property name": `USABO Study Platform`
5. Select "Web" and enter your website URL: `https://usabo-website-prod.eba-cqd3je9y.us-east-1.elasticbeanstalk.com`
6. Copy your **Measurement ID** (looks like `G-XXXXXXXXXX`)

### 2. Create Service Account for API Access
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Google Analytics Reporting API" and "Google Analytics Data API"
4. Go to "IAM & Admin" → "Service Accounts" → "Create Service Account"
5. Name: `analytics-reporter`, Description: `Service account for automated analytics reports`
6. Download the JSON key file
7. In Google Analytics, add the service account email to your property:
   - Analytics → Admin → Property Access Management
   - Add the service account email with "Viewer" permissions

### 3. Set Up Gmail App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Step Verification (if not already enabled)
3. Go to "Security" → "App passwords"
4. Generate an app password for "Mail"
5. Copy the 16-character password

### 4. Configure Environment Variables on AWS
Run these commands to set up the environment variables:

```bash
# Set Google Analytics ID (replace with your actual ID)
eb setenv GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Set Property ID (get from Google Analytics Admin)
eb setenv GOOGLE_ANALYTICS_PROPERTY_ID=123456789

# Upload service account key to AWS and set path
# First upload the JSON file to your server, then:
eb setenv GOOGLE_APPLICATION_CREDENTIALS=/var/app/current/config/service-account-key.json

# Set Gmail credentials
eb setenv GMAIL_USER=tengshangjie00@gmail.com
eb setenv GMAIL_APP_PASSWORD=your_16_character_app_password
```

### 5. Upload Service Account Key
1. Upload your service account JSON file to AWS:
   - Create a `config` folder in your project
   - Put the JSON file there as `service-account-key.json`
   - Deploy the update

## 📧 Email Reports Features

Your automated reports include:
- 📊 **Key Metrics**: Total users, sessions, page views, session duration, bounce rate
- 🏆 **Top 10 Pages**: Most visited pages with view counts
- 📱 **Device Breakdown**: Desktop, mobile, tablet usage
- 🌍 **Geographic Data**: Top countries by user count
- 📅 **Schedule**: Every 2 days at midnight

## 🧪 Testing

After configuration, test the reporting:
1. Visit: `https://your-aws-url.com/admin/send-analytics-report`
2. Check your email at `tengshangjie00@gmail.com`
3. You should receive a beautifully formatted analytics report

## 🔄 Next Steps

1. **Configure the settings above**
2. **Deploy with environment variables**
3. **Test the system**
4. **Enjoy automated analytics reports every 2 days!**

---

**Note**: The analytics will only start collecting data after the Google Analytics ID is properly configured and deployed.