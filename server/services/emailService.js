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
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        pool: true, // Enable connection pooling
        maxConnections: 5, // Limit concurrent connections
        maxMessages: 100, // Messages per connection
        rateLimit: 14, // Messages per second
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 5000, // 5 seconds greeting timeout
        socketTimeout: 30000 // 30 seconds socket timeout
      });

      // Email service initialized successfully
    } catch (error) {
      console.error('Email service initialization failed:', error);
    }
  }

  /**
   * Send OTP email with optimized delivery
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} name - User name
   * @param {string} role - User role (for priority handling)
   */
  async sendOTP(email, otp, name, role = 'user') {
    const startTime = Date.now();
    
    try {
      // Simplified HTML for faster processing
      const isAdmin = role === 'admin' || role === 'subadmin';
      const priority = isAdmin ? 'high' : 'normal';
      
      const mailOptions = {
        from: `SafeTourAI <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `SafeTourAI - ${isAdmin ? 'Admin ' : ''}Email Verification OTP`,
        priority: priority,
        html: isAdmin ? `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#f5f5f5;">
            <div style="background:#667eea;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;">SafeTourAI Admin</h1>
              <p style="margin:5px 0 0 0;">Email Verification</p>
            </div>
            <div style="background:white;padding:30px;border-radius:0 0 8px 8px;">
              <h2>Hello ${name}!</h2>
              <p>Your admin verification code:</p>
              <div style="background:#f8f9ff;border:2px solid #667eea;padding:15px;text-align:center;margin:20px 0;border-radius:8px;">
                <div style="font-size:28px;font-weight:bold;color:#667eea;letter-spacing:3px;">${otp}</div>
              </div>
              <p style="color:#666;font-size:14px;">Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. Do not share this code.</p>
            </div>
          </div>
        ` : `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#f5f5f5;">
            <div style="background:#667eea;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;">SafeTourAI</h1>
              <p style="margin:5px 0 0 0;">Email Verification</p>
            </div>
            <div style="background:white;padding:30px;border-radius:0 0 8px 8px;">
              <h2>Hello ${name}!</h2>
              <p>Your verification code:</p>
              <div style="background:#f8f9ff;border:2px solid #667eea;padding:15px;text-align:center;margin:20px 0;border-radius:8px;">
                <div style="font-size:28px;font-weight:bold;color:#667eea;letter-spacing:3px;">${otp}</div>
              </div>
              <p style="color:#666;font-size:14px;">Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`📧 OTP email sent successfully to: ${email} (${duration}ms) ${isAdmin ? '[ADMIN PRIORITY]' : ''}`);

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(`❌ Failed to send OTP email to ${email} after ${duration}ms:`, error);
      throw new Error('Failed to send verification email');
    }
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
