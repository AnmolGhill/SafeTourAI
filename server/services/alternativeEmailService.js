const nodemailer = require('nodemailer');

/**
 * Alternative Email Service for production environments
 * Optimized for cloud deployments like Render, Heroku, etc.
 */
class AlternativeEmailService {
  constructor() {
    this.transporter = null;
    this.fallbackTransporter = null;
    this.initializeTransporters();
  }

  initializeTransporters() {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Primary transporter with optimized settings for cloud environments
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // Use STARTTLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        // Cloud-optimized settings
        pool: false, // Disable connection pooling for better reliability
        maxConnections: 1,
        maxMessages: 1,
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000,     // 60 seconds
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        // Retry settings
        retryDelay: 3000,
        maxRetries: 3
      });

      // Fallback transporter with different settings
      this.fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('🔄 Alternative email service initialized with fallback support');
    } catch (error) {
      console.error('Alternative email service initialization failed:', error);
    }
  }

  async sendEmailWithFallback(mailOptions, attempt = 1) {
    const transporter = attempt === 1 ? this.transporter : this.fallbackTransporter;
    const transporterType = attempt === 1 ? 'PRIMARY' : 'FALLBACK';
    
    try {
      console.log(`📤 Attempting to send email using ${transporterType} transporter (attempt ${attempt})`);
      
      // Verify connection before sending
      await transporter.verify();
      console.log(`✅ ${transporterType} transporter verified successfully`);
      
      const result = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully via ${transporterType} transporter`);
      return result;
      
    } catch (error) {
      console.error(`❌ ${transporterType} transporter failed:`, error.message);
      
      if (attempt === 1) {
        console.log('🔄 Switching to fallback transporter...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return this.sendEmailWithFallback(mailOptions, 2);
      } else {
        throw error;
      }
    }
  }

  async sendOTP(email, otp, name, role = 'user') {
    const startTime = Date.now();
    
    try {
      const isAdmin = role === 'admin' || role === 'subadmin';
      
      const mailOptions = {
        from: `"SafeTourAI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `SafeTourAI - ${isAdmin ? 'Admin ' : ''}Email Verification OTP`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#f5f5f5;">
            <div style="background:#667eea;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;">SafeTourAI${isAdmin ? ' Admin' : ''}</h1>
              <p style="margin:5px 0 0 0;">Email Verification</p>
            </div>
            <div style="background:white;padding:30px;border-radius:0 0 8px 8px;">
              <h2>Hello ${name}!</h2>
              <p>Your ${isAdmin ? 'admin ' : ''}verification code:</p>
              <div style="background:#f8f9ff;border:2px solid #667eea;padding:15px;text-align:center;margin:20px 0;border-radius:8px;">
                <div style="font-size:28px;font-weight:bold;color:#667eea;letter-spacing:3px;">${otp}</div>
              </div>
              <p style="color:#666;font-size:14px;">Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes${isAdmin ? '. Do not share this code.' : ''}.</p>
            </div>
          </div>
        `
      };

      await this.sendEmailWithFallback(mailOptions);
      
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
}

module.exports = new AlternativeEmailService();
