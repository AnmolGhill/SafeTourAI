const nodemailer = require('nodemailer');

/**
 * Cloud-optimized Email Service for Render.com and similar hosting providers
 * This service uses alternative SMTP configurations that work better with cloud hosting
 */
class CloudEmailService {
  constructor() {
    this.transporter = null;
    this.fallbackTransporter = null;
    this.initializeTransporters();
  }

  initializeTransporters() {
    try {
      // Primary transporter - Gmail with cloud-optimized settings
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        // Cloud hosting optimized settings
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000,     // 60 seconds
        pool: false, // Disable connection pooling
        maxConnections: 1,
        maxMessages: 1,
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        }
      });

      // Fallback transporter - Alternative port configuration
      this.fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        connectionTimeout: 45000,
        greetingTimeout: 20000,
        socketTimeout: 45000,
        pool: false,
        maxConnections: 1,
        maxMessages: 1,
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('☁️ Cloud email service initialized with fallback support');
    } catch (error) {
      console.error('❌ Cloud email service initialization failed:', error);
    }
  }

  async sendEmailWithFallback(mailOptions, attempt = 1) {
    const transporter = attempt === 1 ? this.transporter : this.fallbackTransporter;
    const transporterType = attempt === 1 ? 'SSL-465' : 'STARTTLS-587';
    
    try {
      console.log(`📤 Attempting to send email using ${transporterType} (attempt ${attempt})`);
      
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully via ${transporterType}`);
      return result;
      
    } catch (error) {
      console.error(`❌ ${transporterType} failed:`, error.message);
      
      if (attempt === 1) {
        console.log('🔄 Switching to fallback transporter...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        return this.sendEmailWithFallback(mailOptions, 2);
      } else {
        throw error;
      }
    }
  }

  async sendOTP(email, otp, name, role = 'user') {
    const startTime = Date.now();
    
    try {
      const roleConfig = this.getRoleConfig(role);
      
      const mailOptions = {
        from: `"SafeTourAI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `SafeTourAI - ${roleConfig.title} Email Verification OTP`,
        html: this.generateOTPEmailHTML(name, otp, role, roleConfig)
      };

      const result = await this.sendEmailWithFallback(mailOptions);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`📧 Cloud OTP email sent successfully to: ${email} (${duration}ms) [${role.toUpperCase()}]`);

      return result;

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(`❌ Failed to send cloud OTP email to ${email} after ${duration}ms:`, error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

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
          <div style="background:${roleConfig.headerColor};color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:24px;">SafeTourAI ${roleConfig.title}</h1>
            <p style="margin:5px 0 0 0;font-size:14px;">Email Verification</p>
          </div>
          
          <div style="background:white;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color:#333;margin-top:0;">Hello ${name}!</h2>
            <p style="color:#666;font-size:16px;">Your ${role === 'user' ? '' : role + ' '}verification code is:</p>
            
            <div style="background:#f8f9ff;border:2px solid ${roleConfig.headerColor};padding:20px;text-align:center;margin:20px 0;border-radius:8px;">
              <div style="font-size:32px;font-weight:bold;color:${roleConfig.headerColor};letter-spacing:4px;font-family:monospace;">${otp}</div>
            </div>
            
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
          
          <div style="text-align:center;padding:20px;color:#999;font-size:12px;">
            <p style="margin:0;">© 2024 SafeTourAI. All rights reserved.</p>
            <p style="margin:5px 0 0 0;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new CloudEmailService();
