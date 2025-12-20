# Email Configuration Guide for WellNest

## 🎯 Overview
This guide will help you configure Gmail to send actual password reset emails with OTP codes and reset links.

## 📧 What You'll Get
Once configured, users will receive professional HTML emails containing:
- ✅ 6-digit OTP code (large, easy to read)
- ✅ "Reset Password Now" button/link
- ✅ WellNest branding with green theme
- ✅ Security warnings
- ✅ 10-minute expiry notice

## 🔧 Step-by-Step Configuration

### Step 1: Get Gmail App Password

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/

2. **Enable 2-Step Verification** (if not already enabled)
   - Click "Security" in the left sidebar
   - Find "2-Step Verification" and turn it ON
   - Follow the prompts to set it up

3. **Generate App Password**
   - Still in "Security", scroll down to "App passwords"
   - Click "App passwords"
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: **WellNest**
   - Click **Generate**
   - **COPY the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 2: Update application.properties

1. **Open the file:**
   ```
   src/main/resources/application.properties
   ```

2. **Replace these lines:**
   ```properties
   spring.mail.username=YOUR_EMAIL@gmail.com
   spring.mail.password=YOUR_APP_PASSWORD
   ```

3. **With your actual credentials:**
   ```properties
   spring.mail.username=md.saidanima367@gmail.com
   spring.mail.password=abcd efgh ijkl mnop
   ```
   (Use the 16-character app password, spaces are optional)

### Step 3: Restart the Application

1. **Stop the current server** (if running)
   - Press `Ctrl + C` in the terminal

2. **Rebuild and restart:**
   ```bash
   .\mvnw.cmd clean install -DskipTests
   .\mvnw.cmd spring-boot:run
   ```

3. **Wait for the server to start** (look for "Started WellnestApplication")

## ✅ Testing the Email

1. **Go to login page:**
   ```
   http://localhost:8080/login.html
   ```

2. **Click "Forgot Password?"**

3. **Enter your email address** (md.saidanima367@gmail.com)

4. **Click "Send OTP"**

5. **Check your email inbox** - You should receive a professional HTML email!

## 📧 Email Features

The email will include:

### Header
- WellNest logo and branding
- Green gradient background

### OTP Section
- Large, bold 6-digit code
- Easy to copy
- Expiry notice (10 minutes)

### Reset Link
- Green "Reset Password Now" button
- Direct link to login page
- Alternative to typing OTP

### Security Notice
- Warning about unauthorized requests
- Instructions to ignore if not requested

### Footer
- Links to website and support
- Copyright notice

## 🔍 Troubleshooting

### Email Not Sending?

1. **Check Console Output**
   - Look for: `✅ OTP email sent successfully`
   - Or: `❌ Failed to send email`

2. **Common Issues:**

   **"Authentication failed"**
   - ❌ Using regular Gmail password
   - ✅ Use App Password instead

   **"Username and Password not accepted"**
   - Check for typos in email/password
   - Make sure 2-Step Verification is enabled
   - Generate a new App Password

   **"Connection timeout"**
   - Check your internet connection
   - Firewall might be blocking port 587

3. **Development Fallback**
   - If email fails, OTP is printed to console
   - Look for: `EMAIL SENDING FAILED - OTP for ... is: 123456`

## 🎨 Email Preview

The email will look like this:

```
┌─────────────────────────────────────┐
│  🏋️ WELLNEST                        │
│  Smart Health & Fitness Companion   │
│  (Green gradient background)        │
├─────────────────────────────────────┤
│  Password Reset Request             │
│                                     │
│  Hello,                             │
│                                     │
│  We received a request to reset    │
│  your WellNest account password...  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Your OTP Code:             │   │
│  │                             │   │
│  │      1 2 3 4 5 6           │   │
│  │                             │   │
│  │  Valid for 10 minutes       │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Reset Password Now] (button)      │
│                                     │
│  ⚠️ Security Notice:                │
│  If you didn't request this...      │
├─────────────────────────────────────┤
│  © 2025 WellNest                    │
│  Visit Website | Contact Support    │
└─────────────────────────────────────┘
```

## 📝 Current Configuration

**File:** `src/main/resources/application.properties`

```properties
# Email Configuration (for sending OTP emails)
# IMPORTANT: Replace these with your actual Gmail credentials
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

## 🚀 Next Steps

1. ✅ Get Gmail App Password
2. ✅ Update application.properties
3. ✅ Restart application
4. ✅ Test forgot password flow
5. ✅ Check email inbox

## 💡 Tips

- **Keep App Password secure** - Don't share it or commit to Git
- **Test with your own email first** before sharing with others
- **Check spam folder** if email doesn't appear in inbox
- **Email delivery** usually takes 1-5 seconds

## 🔒 Security Notes

- App Passwords are safer than using your actual Gmail password
- Each App Password is unique and can be revoked
- If compromised, revoke and generate a new one
- Never commit credentials to version control

---

**Need Help?** Check the console output for detailed error messages!
