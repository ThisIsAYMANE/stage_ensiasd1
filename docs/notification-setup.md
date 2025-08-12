# Lesson Notification System Setup

This document explains how to set up automated lesson notifications for the TutorConnect platform.

## Overview

The notification system automatically sends:
1. **1-hour reminders** to both students and tutors before lessons
2. **Google Meet links** 1 minute before lessons start

## How It Works

### 1. Notification Service (`lib/notification-service.ts`)
- Generates unique Google Meet links for each lesson
- Sends email notifications to students and tutors
- Processes notifications based on lesson timing

### 2. API Endpoint (`/api/notifications/process`)
- **POST**: Processes all pending notifications
- **GET**: Returns upcoming lessons that need notifications

### 3. Client Integration
- Manual notification processing from dashboards
- Real-time notification status display
- Integration with lesson management

## Setup Instructions

### Option 1: External Cron Job (Recommended for Production)

Set up a cron job to call the notification API every minute:

```bash
# Add to crontab (crontab -e)
* * * * * curl -X POST https://yourdomain.com/api/notifications/process
```

### Option 2: Vercel Cron Jobs

If using Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/process",
      "schedule": "* * * * *"
    }
  ]
}
```

### Option 3: Manual Testing

Use the "Process Notifications" button in both student and tutor dashboards to manually trigger notifications.

## Email Service Integration

Currently, the system logs emails to the console. To send actual emails, integrate with:

### SendGrid
```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// In sendEmailNotification method
const msg = {
  to: email,
  from: 'noreply@tutorconnect.com',
  subject: subject,
  text: body,
};
await sgMail.send(msg);
```

### AWS SES
```typescript
import AWS from 'aws-sdk';
const ses = new AWS.SES();

// In sendEmailNotification method
const params = {
  Source: 'noreply@tutorconnect.com',
  Destination: { ToAddresses: [email] },
  Message: {
    Subject: { Data: subject },
    Body: { Text: { Data: body } }
  }
};
await ses.sendEmail(params).promise();
```

### Nodemailer (SMTP)
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// In sendEmailNotification method
await transporter.sendMail({
  from: 'noreply@tutorconnect.com',
  to: email,
  subject: subject,
  text: body
});
```

## Environment Variables

Add these to your `.env.local`:

```bash
# For SendGrid
SENDGRID_API_KEY=your_api_key

# For AWS SES
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# For SMTP
EMAIL_USER=your_email
EMAIL_PASS=your_password

# API Security (optional)
NOTIFICATION_API_KEY=your_secret_key
```

## Testing

### 1. Create a Test Lesson
- Book a lesson for 1-2 hours from now
- Confirm the lesson as a tutor

### 2. Test Notifications
- Wait for the 1-hour reminder
- Check console logs for email content
- Verify Google Meet link generation

### 3. Monitor API
```bash
# Check upcoming lessons
curl https://yourdomain.com/api/notifications/process

# Process notifications
curl -X POST https://yourdomain.com/api/notifications/process
```

## Troubleshooting

### Common Issues

1. **Notifications not sending**
   - Check cron job is running
   - Verify API endpoint is accessible
   - Check console for errors

2. **Wrong timing**
   - Ensure server timezone is correct
   - Verify lesson date/time format

3. **Email delivery**
   - Check email service credentials
   - Verify sender email is configured
   - Check spam folders

### Debug Mode

Enable detailed logging by adding to your environment:

```bash
DEBUG_NOTIFICATIONS=true
```

## Security Considerations

1. **API Protection**: Consider adding API key authentication
2. **Rate Limiting**: Implement rate limiting for the notification endpoint
3. **Email Validation**: Ensure email addresses are validated
4. **Spam Prevention**: Use proper email authentication (SPF, DKIM)

## Performance

- The system processes notifications in batches
- Lessons are filtered by status and timing
- Client-side sorting avoids Firebase index requirements
- Notifications are processed asynchronously

## Future Enhancements

1. **Push Notifications**: Integrate with Firebase Cloud Messaging
2. **SMS Notifications**: Add text message support
3. **Custom Reminders**: Allow users to set custom reminder times
4. **Notification Preferences**: Let users choose notification methods
5. **Calendar Integration**: Sync with Google Calendar, Outlook, etc.
