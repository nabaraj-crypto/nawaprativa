# Email Setup Guide for Nawa Prativa School

## How Students/Users Receive Emails

When an admin sends emails through the admin panel, students will receive them in the following ways:

### 1. **Email Configuration Setup**

To enable real email sending, you need to configure your email settings in `backend/settings.py`:

#### Option A: Gmail Setup (Recommended for testing)
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'nawaprativaschool@gmail.com'  # Replace with your Gmail
EMAIL_HOST_PASSWORD = 'jrnz pvxz kmvz gyxb'  # Replace with Gmail App Password
DEFAULT_FROM_EMAIL = 'Nawa Prativa School <nawaprativaschool@gmail.com>'
```

**To get Gmail App Password:**
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_HOST_PASSWORD`

#### Option B: Console Backend (For Development/Testing)
```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```
This will print emails to the console instead of sending them.

#### Option C: Other Email Providers
- **Outlook/Hotmail**: Use `smtp-mail.outlook.com` on port 587
- **Yahoo**: Use `smtp.mail.yahoo.com` on port 587
- **Custom SMTP**: Use your provider's SMTP settings

### 2. **How Students Receive Emails**

#### A. **Student Email Addresses**
Students need to have email addresses in their profiles:
- Go to Admin Panel → Students
- Edit each student and add their email address
- Or use the bulk import feature to add emails

#### B. **Email Content**
Students will receive:
- **HTML Email**: Beautiful formatted email with school branding
- **Plain Text Email**: Fallback for email clients that don't support HTML
- **Subject**: "Result Notification - [Student Name] ([Exam Type])"
- **Content**: Complete result details with subject-wise marks, grades, and overall performance

#### C. **Email Features**
- **Personalized**: Each email is personalized with student's name and results
- **Professional Design**: School branding and professional layout
- **Complete Results**: Subject-wise marks, theory/practical breakdown, grades, and overall performance
- **Action Links**: Direct link to view detailed result card online
- **Contact Information**: School contact details for questions

### 3. **How to Send Emails**

#### A. **Single Student Email**
1. Go to Admin Panel → Results
2. Click "Email Notifications" button
3. Select a student from the list
4. Click "Send Email"

#### B. **Bulk Email to Multiple Students**
1. Go to Admin Panel → Results
2. Click "Email Notifications" button
3. Select multiple students using checkboxes
4. Use "Select All" to select all students
5. Click "Send Emails"

### 4. **Email Templates**

The system uses two email templates:
- `backend/templates/emails/result_notification.html` - HTML version
- `backend/templates/emails/result_notification.txt` - Plain text version

You can customize these templates to match your school's branding.

### 5. **Testing Email Setup**

#### A. **Test with Console Backend**
1. Set `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`
2. Send a test email
3. Check the console output to see the email content

#### B. **Test with Real Email**
1. Configure Gmail or other provider
2. Send a test email to yourself first
3. Check if the email is received properly

### 6. **Troubleshooting**

#### Common Issues:
1. **"Authentication failed"**: Check your email credentials
2. **"Connection refused"**: Check firewall settings or try different port
3. **"No email found"**: Make sure students have email addresses in their profiles
4. **"Template not found"**: Make sure email templates exist in the correct directory

#### Debug Steps:
1. Check Django logs for error messages
2. Test email configuration with a simple test
3. Verify student email addresses are valid
4. Check if your email provider allows SMTP access

### 7. **Security Considerations**

1. **Never commit email passwords to version control**
2. Use environment variables for sensitive data:
   ```python
   import os
   EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PASSWORD')
   ```
3. Use app passwords instead of regular passwords for Gmail
4. Consider using email services like SendGrid or Mailgun for production

### 8. **Production Setup**

For production, consider:
- Using professional email services (SendGrid, Mailgun, AWS SES)
- Setting up email queuing for bulk emails
- Implementing email tracking and delivery reports
- Adding email templates for different types of notifications

### 9. **Example Email Configuration**

```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'school@nawaprativa.edu.np'
EMAIL_HOST_PASSWORD = 'your-secure-app-password'
DEFAULT_FROM_EMAIL = 'Nawa Prativa School <school@nawaprativa.edu.np>'
DEFAULT_TO_EMAIL = 'admin@nawaprativa.edu.np'
```

### 10. **Student Email Requirements**

For students to receive emails:
1. Student must have a valid email address in their profile
2. Email address should be properly formatted (e.g., student@example.com)
3. Student should have results in the system
4. Admin must have proper permissions to send emails

This setup ensures that when admins send result notifications, students receive professional, personalized emails with their complete result information. 