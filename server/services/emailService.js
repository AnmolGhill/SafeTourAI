const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.logger = null;
    this.initializeTransporter();
  }

  getLogger() {
    if (!this.logger) {
      this.logger = require('../utils/logger');
    }
    return this.logger;
  }

  initializeTransporter() {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Use Gmail API for production (works on Render.com), SMTP for development
      if (isProduction && process.env.USE_GMAIL_API === 'true') {
        // Gmail API for production - bypasses SMTP port restrictions
        this.useGmailApi = true;
        this.gmailApiService = require('./gmailApiService');
        console.log('📧 Email service initialized with Gmail API for production (Render.com compatible)');
        return; // Skip nodemailer setup
      } else if (isProduction && process.env.USE_SENDGRID === 'true') {
        // SendGrid for production (free 100 emails/day)
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
        console.log('📧 Email service initialized with SendGrid for production');
      } else if (isProduction && process.env.USE_MAILTRAP === 'true') {
        // Mailtrap for production testing
        this.transporter = nodemailer.createTransport({
          host: 'smtp.mailtrap.io',
          port: 2525,
          auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS
          }
        });
        console.log('📧 Email service initialized with Mailtrap for production');
      } else {
        // Gmail SMTP for development or if no alternative is configured
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          },
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 10000
        });
        console.log(`📧 Email service initialized with Gmail SMTP for ${isProduction ? 'production' : 'development'}`);
        
        if (isProduction) {
          console.log('⚠️ Warning: Using Gmail SMTP in production may not work on Render.com due to port restrictions');
        }
      }
      
      this.useGmailApi = false;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Send OTP email with role-based templates and reliable delivery
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} name - User name
   * @param {string} role - User role (user, admin, subadmin)
   */
  async sendOTP(email, otp, name, role = 'user') {
    const startTime = Date.now();
    
    try {
      // Use Gmail API if configured, otherwise use SMTP
      if (this.useGmailApi && this.gmailApiService) {
        console.log('📧 Using Gmail API for email delivery');
        const result = await this.gmailApiService.sendOTP(email, otp, name, role);
        return result;
      }
      
      // SMTP fallback with retry mechanism
      const maxRetries = process.env.NODE_ENV === 'production' ? 3 : 1;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Skip verification in production to avoid timeout issues
          if (process.env.NODE_ENV !== 'production') {
            await this.transporter.verify();
            console.log('✅ SMTP connection verified');
          }
          
          // Role-based email configuration
          const roleConfig = this.getRoleConfig(role);
          
          const mailOptions = {
            from: `"SafeTourAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `SafeTourAI - ${roleConfig.title} Email Verification OTP`,
            html: this.generateOTPEmailHTML(name, otp, role, roleConfig)
          };

          const result = await this.transporter.sendMail(mailOptions);
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`📧 OTP email sent successfully to: ${email} (${duration}ms) [${role.toUpperCase()}] ${attempt > 1 ? `[Retry ${attempt}]` : ''}`);
          console.log(`📨 Message ID: ${result.messageId}`);
          
          return result;

        } catch (error) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.error(`❌ Attempt ${attempt}/${maxRetries} failed to send OTP email to ${email} (${duration}ms):`, error);
          
          // Log specific error details for debugging
          if (error.code) {
            console.error(`📋 Error Code: ${error.code}`);
          }
          if (error.response) {
            console.error(`📋 SMTP Response: ${error.response}`);
          }
          if (error.command) {
            console.error(`📋 Failed Command: ${error.command}`);
          }
          
          // If this is the last attempt, throw the error
          if (attempt === maxRetries) {
            throw new Error(`Failed to send verification email after ${maxRetries} attempts: ${error.message}`);
          }
          
          // Wait before retry with exponential backoff
          const waitTime = attempt * 2000; // 2s, 4s, 6s...
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Reinitialize transporter for next attempt
          console.log('🔄 Reinitializing email transporter...');
          this.initializeTransporter();
        }
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(`❌ Failed to send OTP email to ${email} (${duration}ms):`, error);
      throw error;
    }
  }

  /**
   * Get role-specific configuration
   * @param {string} role - User role
   * @returns {object} Role configuration
   */
  getRoleConfig(role) {
    const configs = {
      admin: {
        title: 'Admin',
        headerColor: '#dc2626', // Red for admin
        priority: 'high',
        securityNote: 'This is an admin account. Do not share this code with anyone.'
      },
      subadmin: {
        title: 'Sub-Admin',
        headerColor: '#ea580c', // Orange for sub-admin
        priority: 'high',
        securityNote: 'This is a sub-admin account. Do not share this code with anyone.'
      },
      user: {
        title: 'User',
        headerColor: '#667eea', // Blue for regular users
        priority: 'normal',
        securityNote: 'Keep this code secure.'
      }
    };
    
    return configs[role] || configs.user;
  }

  /**
   * Generate role-based OTP email HTML
   * @param {string} name - User name
   * @param {string} otp - OTP code
   * @param {string} role - User role
   * @param {object} roleConfig - Role configuration
   * @returns {string} HTML email template
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
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send KYC approval notification
   * @param {string} email - Recipient email
   * @param {string} name - User name
   * @param {string} blockchainId - Blockchain ID
   */
  async sendKYCApproval(email, name, blockchainId) {
    try {
      const mailOptions = {
        from: `SafeTourAI <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'SafeTourAI - KYC Approved! Your Digital ID is Ready',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
              .blockchain-id { font-family: monospace; font-size: 18px; font-weight: bold; color: #00b894; background: white; padding: 10px; border-radius: 5px; margin: 10px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1> Congratulations ${name}!</h1>
                <p>Your KYC has been approved</p>
              </div>
              <div class="content">
                <div class="success-box">
                  <h2>KYC Verification Complete</h2>
                  <p>Your identity has been successfully verified and your blockchain digital ID has been generated.</p>
                </div>
                
                <h3>Your Blockchain Digital ID:</h3>
                <div class="blockchain-id">${blockchainId}</div>
                
                <h3>What's Next?</h3>
                <ul>
                  <li>Access your digital ID in the dashboard</li>
                  <li>Enhanced security features are now available</li>
                  <li>Your identity is now secured on the blockchain</li>
                  <li>Full access to emergency features</li>
                </ul>
                
                <p><strong>Important:</strong> Keep your blockchain ID safe. This is your unique digital identity on the SafeTourAI platform.</p>
              </div>
              <div class="footer">
                <p> 2024 SafeTourAI. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`KYC approval email sent to: ${email}`);

    } catch (error) {
      console.error('Failed to send KYC approval email:', error);
      throw new Error('Failed to send approval notification');
    }
  }

  /**
   * Send password reset OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - Reset OTP code
   */
  async sendPasswordResetOTP(email, otp) {
    try {
      const mailOptions = {
        from: `SafeTourAI <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'SafeTourAI - Password Reset Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #e17055 0%, #d63031 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-box { background: #fff; border: 2px dashed #e17055; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #e17055; letter-spacing: 5px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 SafeTourAI</h1>
                <p>Password Reset Request</p>
              </div>
              <div class="content">
                <h2>Password Reset Code</h2>
                <p>You requested to reset your SafeTourAI account password. Use the code below to proceed:</p>
                
                <div class="otp-box">
                  <p>Your reset code is:</p>
                  <div class="otp-code">${otp}</div>
                </div>
                
                <div class="warning">
                  <strong>Security Notice:</strong>
                  <ul>
                    <li>This code expires in 15 minutes</li>
                    <li>Never share this code with anyone</li>
                    <li>If you didn't request this, ignore this email</li>
                    <li>Your password remains unchanged until you complete the reset</li>
                  </ul>
                </div>
                
                <p>After entering this code, you'll be able to set a new password for your account.</p>
              </div>
              <div class="footer">
                <p>© 2024 SafeTourAI. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`🔐 Password reset OTP sent successfully to: ${email}`);

    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send KYC rejection notification
   * @param {string} email - Recipient email
   * @param {string} name - User name
   * @param {string} reason - Rejection reason
   */
  async sendKYCRejection(email, name, reason) {
    try {
      const mailOptions = {
        from: `SafeTourAI <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'SafeTourAI - KYC Application Update Required',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #e17055 0%, #d63031 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .warning-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 10px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SafeTourAI</h1>
                <p>KYC Application Update Required</p>
              </div>
              <div class="content">
                <h2>Hello ${name},</h2>
                
                <div class="warning-box">
                  <h3>📋 Application Review Complete</h3>
                  <p>We've reviewed your KYC application and need you to address the following:</p>
                  <p><strong>Reason:</strong> ${reason}</p>
                </div>
                
                <h3>Next Steps:</h3>
                <ul>
                  <li>📝 Review the feedback above</li>
                  <li>📄 Update your documents if needed</li>
                  <li>🔄 Resubmit your KYC application</li>
                  <li>📞 Contact support if you need assistance</li>
                </ul>
                
                <p>Don't worry! This is a common part of the verification process. Please address the mentioned points and resubmit your application.</p>
              </div>
              <div class="footer">
                <p>© 2024 SafeTourAI. All rights reserved.</p>
                <p>Need help? Contact our support team.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📋 KYC rejection email sent to: ${email}`);

    } catch (error) {
      console.error('❌ Failed to send KYC rejection email:', error);
      throw new Error('Failed to send rejection notification');
    }
  }
}

module.exports = new EmailService();
