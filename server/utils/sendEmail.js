const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
let transporter;

const initializeEmailTransporter = () => {
  try {
    transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log('Email transporter initialized successfully');
  } catch (error) {
    console.error('Error initializing email transporter:', error.message);
  }
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} name - Recipient name
 * @returns {Promise} - Email send result
 */
const sendOtpEmail = async (email, otp, name = 'User') => {
  try {
    if (!transporter) {
      initializeEmailTransporter();
    }

    const mailOptions = {
      from: `"SafeTourAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'SafeTourAI - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">SafeTourAI Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with SafeTourAI. Please use the following OTP to verify your email address:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from SafeTourAI. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

/**
 * Send emergency alert email
 * @param {string} email - Recipient email
 * @param {object} emergencyData - Emergency details
 * @returns {Promise} - Email send result
 */
const sendEmergencyAlert = async (email, emergencyData) => {
  try {
    if (!transporter) {
      initializeEmailTransporter();
    }

    const { userName, location, emergencyType, timestamp } = emergencyData;

    const mailOptions = {
      from: `"SafeTourAI Emergency Alert" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🚨 EMERGENCY ALERT - SafeTourAI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🚨 EMERGENCY ALERT</h1>
          </div>
          <div style="padding: 20px;">
            <p><strong>An emergency has been reported by ${userName}</strong></p>
            <div style="background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545;">
              <p><strong>Emergency Type:</strong> ${emergencyType}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            </div>
            <p style="color: #dc3545; font-weight: bold;">
              Please take immediate action or contact emergency services if necessary.
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="tel:911" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Call Emergency Services
              </a>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Emergency alert email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending emergency alert email:', error);
    throw error;
  }
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @returns {Promise} - Email send result
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    if (!transporter) {
      initializeEmailTransporter();
    }

    const mailOptions = {
      from: `"SafeTourAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to SafeTourAI - Your Safety Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Welcome to SafeTourAI!</h2>
          <p>Hello ${name},</p>
          <p>Welcome to SafeTourAI - your trusted companion for safe travels and emergency assistance.</p>
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #007bff;">What you can do with SafeTourAI:</h3>
            <ul>
              <li>🚨 Send emergency alerts to family and responders</li>
              <li>📍 Share your real-time location with trusted contacts</li>
              <li>🔒 Secure blockchain-based transaction recording</li>
              <li>📱 Receive instant notifications and updates</li>
            </ul>
          </div>
          <p>Your account has been successfully created and verified. You can now start using all features of SafeTourAI.</p>
          <p>Stay safe and travel with confidence!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            If you have any questions, feel free to contact our support team.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} name - Recipient name
 * @returns {Promise} - Email send result
 */
const sendPasswordResetEmail = async (email, resetToken, name = 'User') => {
  try {
    if (!transporter) {
      initializeEmailTransporter();
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"SafeTourAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'SafeTourAI - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your SafeTourAI account password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from SafeTourAI. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  initializeEmailTransporter,
  sendOtpEmail,
  sendEmergencyAlert,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
