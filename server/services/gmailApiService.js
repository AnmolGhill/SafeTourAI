const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Gmail API Service for sending emails via Google API (works on Render.com)
 * Uses OAuth2 instead of SMTP - bypasses port restrictions
 */
class GmailApiService {
  constructor() {
    this.gmail = null;
    this.oAuth2Client = null;
    this.initializeGmailApi();
  }

  initializeGmailApi() {
    try {
      // OAuth2 credentials from environment variables (secure)
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
      const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';

      if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('Google OAuth2 credentials not found in environment variables');
      }

      // Create OAuth2 client
      this.oAuth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
      );

      // Load tokens from file
      const tokenPath = path.join(__dirname, '..', 'gmail-tokens.json');
      
      if (!fs.existsSync(tokenPath)) {
        throw new Error('Gmail tokens not found. Please run: node utils/generateGmailToken.js');
      }

      const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      this.oAuth2Client.setCredentials(tokens);

      // Initialize Gmail API
      this.gmail = google.gmail({ version: 'v1', auth: this.oAuth2Client });

      console.log('📧 Gmail API service initialized successfully');
    } catch (error) {
      console.error('❌ Gmail API initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Create email message in RFC 2822 format
   */
  createEmailMessage(to, subject, htmlContent) {
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      htmlContent
    ];

    const email = emailLines.join('\r\n');
    return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Send OTP email using Gmail API
   */
  async sendOTP(email, otp, name, role = 'user') {
    const startTime = Date.now();
    
    try {
      // Role-based email configuration
      const roleConfig = this.getRoleConfig(role);
      
      const subject = `SafeTourAI - ${roleConfig.title} Email Verification OTP`;
      const htmlContent = this.generateOTPEmailHTML(name, otp, role, roleConfig);
      
      // Create email message
      const rawMessage = this.createEmailMessage(email, subject, htmlContent);
      
      // Send email via Gmail API
      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`📧 Gmail API OTP sent successfully to: ${email} (${duration}ms) [${role.toUpperCase()}]`);
      console.log(`📨 Message ID: ${result.data.id}`);
      
      return result.data;

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`❌ Failed to send Gmail API OTP to ${email} (${duration}ms):`, error);
      
      // Handle specific Gmail API errors
      if (error.code === 401) {
        console.error('📋 Authentication error - tokens may be expired. Run: node utils/generateGmailToken.js');
      } else if (error.code === 403) {
        console.error('📋 Permission error - check Gmail API is enabled and scopes are correct');
      } else if (error.code === 429) {
        console.error('📋 Rate limit exceeded - too many emails sent');
      }
      
      throw new Error(`Failed to send verification email via Gmail API: ${error.message}`);
    }
  }

  /**
   * Get role-specific configuration
   */
  getRoleConfig(role) {
    const configs = {
      admin: {
        title: 'Admin',
        headerColor: '#dc2626',
        securityNote: 'This is an admin account. Do not share this code with anyone.'
      },
      subadmin: {
        title: 'Sub-Admin',
        headerColor: '#ea580c',
        securityNote: 'This is a sub-admin account. Do not share this code with anyone.'
      },
      user: {
        title: 'User',
        headerColor: '#667eea',
        securityNote: 'Keep this code secure.'
      }
    };
    
    return configs[role] || configs.user;
  }

  /**
   * Generate role-based OTP email HTML
   */
  generateOTPEmailHTML(name, otp, role, roleConfig) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SafeTourAI - Email Verification</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
        <div style="max-width:500px;margin:0 auto;padding:20px;">
          <!-- Header -->
          <div style="background:${roleConfig.headerColor};color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:24px;">SafeTourAI ${roleConfig.title}</h1>
            <p style="margin:5px 0 0 0;font-size:14px;">Email Verification</p>
          </div>
          
          <!-- Content -->
          <div style="background:white;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color:#333;margin-top:0;">Hello ${name}!</h2>
            <p style="color:#666;font-size:16px;">Your ${role === 'user' ? '' : role + ' '}verification code is:</p>
            
            <!-- OTP Box -->
            <div style="background:#f8f9ff;border:2px solid ${roleConfig.headerColor};padding:20px;text-align:center;margin:20px 0;border-radius:8px;">
              <div style="font-size:32px;font-weight:bold;color:${roleConfig.headerColor};letter-spacing:4px;font-family:monospace;">${otp}</div>
            </div>
            
            <!-- Security Notice -->
            <div style="background:#fff3cd;border:1px solid #ffeaa7;padding:15px;border-radius:5px;margin:20px 0;">
              <p style="margin:0;color:#856404;font-size:14px;">
                <strong>⚠️ Security Notice:</strong><br>
                • Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes<br>
                • ${roleConfig.securityNote}<br>
                • If you didn't request this, please ignore this email
              </p>
            </div>
            
            <p style="color:#666;font-size:14px;margin-bottom:0;">
              Thank you for choosing SafeTourAI for secure travel experiences.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align:center;padding:20px;color:#999;font-size:12px;">
            <p style="margin:0;">© 2024 SafeTourAI. All rights reserved.</p>
            <p style="margin:5px 0 0 0;">This is an automated message, please do not reply.</p>
            <p style="margin:5px 0 0 0;">Sent via Gmail API</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new GmailApiService();
