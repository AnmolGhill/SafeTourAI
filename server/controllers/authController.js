const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOtpWithExpiry } = require('../utils/generateOtp');
const { sendOtpEmail, sendWelcomeEmail } = require('../utils/sendEmail');
const { verifyIdToken } = require('../config/firebase');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, phone, emergencyContacts } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check rate limiting for OTP
    const rateLimit = await Otp.checkRateLimit(email, 'email_verification');
    if (!rateLimit.isAllowed) {
      return res.status(429).json({
        success: false,
        message: `Too many OTP requests. Try again after ${rateLimit.timeWindowMinutes} minutes`
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      phone,
      emergencyContacts: emergencyContacts || []
    });

    await user.save();

    // Generate and send OTP
    const { otp, expiresAt } = generateOtpWithExpiry();
    await Otp.createOtp(email, otp, 'email_verification', 10, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await sendOtpEmail(email, otp, name);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      data: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        otpExpiresAt: expiresAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find valid OTP
    const otpRecord = await Otp.findValidOtp(email, 'email_verification');
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No valid OTP found for this email'
      });
    }

    // Verify OTP
    const verificationResult = otpRecord.verify(otp);
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message,
        attemptsLeft: verificationResult.attemptsLeft
      });
    }

    // Update user as verified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isEmailVerified = true;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(email, user.name);

    // Generate JWT token
    const token = generateToken(user.userId);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password, firebaseToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Update Firebase token if provided
    if (firebaseToken) {
      user.firebaseToken = firebaseToken;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user.userId);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          emergencyContacts: user.emergencyContacts,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Firebase login
const firebaseLogin = async (req, res) => {
  try {
    const { idToken, userData } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);
    const { email, name, uid } = decodedToken;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user from Firebase data
      user = new User({
        name: name || userData?.name || 'User',
        email,
        password: 'firebase_auth', // Placeholder password
        phone: userData?.phone || '',
        isEmailVerified: true, // Firebase emails are pre-verified
        firebaseToken: idToken
      });
      await user.save();
    } else {
      // Update existing user
      user.firebaseToken = idToken;
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user.userId);

    res.status(200).json({
      success: true,
      message: 'Firebase login successful',
      data: {
        token,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          emergencyContacts: user.emergencyContacts,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({
      success: false,
      message: 'Firebase login failed',
      error: error.message
    });
  }
};

// Resend OTP
const resendOtp = async (req, res) => {
  try {
    const { email, purpose = 'email_verification' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check rate limiting
    const rateLimit = await Otp.checkRateLimit(email, purpose);
    if (!rateLimit.isAllowed) {
      return res.status(429).json({
        success: false,
        message: `Too many OTP requests. Try again after ${rateLimit.timeWindowMinutes} minutes`
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate and send new OTP
    const { otp, expiresAt } = generateOtpWithExpiry();
    await Otp.createOtp(email, otp, purpose, 10, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await sendOtpEmail(email, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        otpExpiresAt: expiresAt
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error.message
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { userId } = req.user;

    // Clear Firebase token
    await User.findOneAndUpdate(
      { userId },
      { firebaseToken: '' }
    );

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          emergencyContacts: user.emergencyContacts,
          preferences: user.preferences,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      error: error.message
    });
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  firebaseLogin,
  resendOtp,
  logout,
  getCurrentUser
};
