# Password Reset Functionality

This document explains how to set up and use the password reset functionality in FlavorSync.

## Overview

The password reset system allows users to regain access to their accounts if they forget their passwords. The system works by:

1. User requests a password reset by providing their email
2. System generates a unique token and sends a reset link to the user's email
3. User clicks the link and is directed to a reset password form
4. User sets a new password, and the token is invalidated

## Setup Instructions

### 1. Email Configuration

The password reset functionality requires email sending capabilities. Configure the email settings in your `.env` file:

```
# Email configuration for password reset
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@flavorsync.com
FRONTEND_URL=http://localhost:3000
```

**Notes for Gmail users:**
- You need to create an "App Password" for security reasons
- Go to your Google Account > Security > 2-Step Verification > App Passwords
- Generate a new app password for "Mail" and "Other (Custom name)"
- Use this generated password in the `.env` file

### 2. Testing Email Configuration

You can test if your email configuration works by running:

```bash
node backend/test-email.js
```

This script will attempt to send a test email and show detailed error messages if it fails.

## How It Works

### Backend Endpoints

The system uses the following API endpoints:

- `POST /api/auth/forgot-password`: Initiates the password reset process
- `GET /api/auth/validate-reset-token/:token`: Validates a reset token
- `POST /api/auth/reset-password`: Resets the password using a valid token

### Database Schema

The User model has been extended with these fields:

```javascript
resetPasswordToken: {
  type: String,
  default: null
},
resetPasswordExpires: {
  type: Date,
  default: null
}
```

## Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ User clicks │     │ Backend      │     │ Email sent to  │
│ "Forgot     │────►│ generates    │────►│ user with      │
│ Password"   │     │ token        │     │ reset link     │
└─────────────┘     └──────────────┘     └────────────────┘
                                                │
┌─────────────┐     ┌──────────────┐     ┌──────▼─────────┐
│ User sets   │     │ Backend      │     │ User clicks    │
│ new password│◄────│ validates    │◄────│ link in email  │
│             │     │ token        │     │                │
└─────────────┘     └──────────────┘     └────────────────┘
```

## Troubleshooting

### Common Issues

1. **Emails not sending:**
   - Check if your email service provider blocks SMTP access
   - Verify your credentials in the `.env` file
   - For Gmail, ensure you're using an App Password if 2FA is enabled

2. **Reset links not working:**
   - Ensure `FRONTEND_URL` is set correctly in `.env`
   - Check if the token has expired (default is 1 hour)
   - Verify that the app navigation is properly set up

3. **Database issues:**
   - Check if the User model has the reset token fields
   - Ensure MongoDB connection is working

### Support

If you encounter any issues, please create an issue in the GitHub repository with:
- A description of the problem
- Steps to reproduce
- Any error messages you're seeing 