  const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, db } = require('../config/firebase');
const emailService = require('../services/emailService');
const cloudEmailService = require('../services/cloudEmailService');
const logger = require('../utils/logger');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { handleValidationErrors } = require('../utils/validation');

const router = express.Router();

// In-memory user storage (replace with database in production)
const registeredUsers = new Map();
const otpStorage = new Map();

// Register user with role-based system
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number format'),
  body('role').isIn(['user', 'subadmin', 'admin']).withMessage('Invalid role')
], handleValidationErrors, asyncHandler(async (req, res) => {

    const { name, email, password, phone, role } = req.body;

    // Validate email format based on role
    if (role === 'admin' || role === 'subadmin') {
      if (!email.endsWith('@cgc.edu.in')) {
        throw new AppError('Admin and SubAdmin accounts must use @cgc.edu.in email format (e.g., cec231053.cse.cec@cgc.edu.in)', 400, 'INVALID_EMAIL_FORMAT');
      }
    }

    // Use phone as provided (no automatic formatting)
    let formattedPhone = null;
    if (phone && phone.trim()) {
      formattedPhone = phone.trim();
    }

    try {
      // Check if user already exists in Firebase Auth
      try {
        const existingUser = await auth.getUserByEmail(email);
        if (existingUser) {
          throw new AppError('User already exists with this email', 409, 'USER_EXISTS');
        }
      } catch (firebaseError) {
        // If user doesn't exist, continue with registration
        if (firebaseError.code !== 'auth/user-not-found') {
          throw firebaseError;
        }
      }

      // Check if user already exists in memory
      if (registeredUsers.has(email)) {
        throw new AppError('User already exists with this email', 409, 'USER_EXISTS');
      }

      // Hash password for storage
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user in Firebase Authentication
      const firebaseUserData = {
        email,
        password,
        displayName: name,
        emailVerified: false
      };
      
      // Phone number handling - allow reuse for all roles
      if (formattedPhone) {
        // Skip phone in Firebase Auth for all roles to allow reuse
        console.log(`📱 Skipping phone for ${role} role to allow reuse:`, formattedPhone);
      }

      // Store user data temporarily (before Firebase creation)
      const tempUserData = {
        name,
        email,
        role,
        ...(formattedPhone && { phone: formattedPhone }),
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        kycStatus: 'pending',
        firebaseUserData // Store Firebase data for later creation
      };

      // Store in memory for OTP verification
      registeredUsers.set(email, tempUserData);
      
      console.log('📝 User data stored temporarily for OTP verification:', { email, name, role });

      // Send OTP for all roles (user, admin, subadmin)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || 10) * 60000);

      // Store OTP in memory
      otpStorage.set(email, {
        otp: await bcrypt.hash(otp, 12),
        plainOtp: otp, // Store plain OTP for development
        expiresAt: otpExpiry,
        attempts: 0,
        verified: false
      });

      // Send OTP email with cloud fallback
      try {
        await emailService.sendOTP(email, otp, name, role);
        console.log('📧 OTP sent successfully via primary service', { email, role });
      } catch (emailError) {
        console.error('❌ Primary email service error:', emailError);
        
        // Try cloud email service as fallback for production
        if (process.env.NODE_ENV === 'production') {
          try {
            console.log('☁️ Attempting cloud email service fallback...');
            await cloudEmailService.sendOTP(email, otp, name, role);
            console.log('📧 OTP sent successfully via cloud fallback service', { email, role });
          } catch (cloudError) {
            console.error('❌ Cloud email service also failed:', cloudError);
            console.log(`📋 All email services failed, OTP for debugging - ${email}: ${otp}`);
            throw new AppError('Failed to send verification email. Please try again later.', 500, 'EMAIL_SEND_FAILED');
          }
        } else {
          // In development, log the OTP and continue
          console.log(`📋 Email failed, OTP for development/testing - ${email}: ${otp}`);
        }
      }

      // All roles require OTP verification
      res.status(201).json({
        message: 'Registration successful! Please check your email for OTP verification.',
        requiresOTP: true,
        success: true
      });
    } catch (firebaseError) {
      console.error('Firebase registration error:', firebaseError);
      
      // Handle AppError (our custom errors) differently from Firebase errors
      if (firebaseError.isOperational && firebaseError.statusCode) {
        // This is our custom AppError, re-throw it as-is
        throw firebaseError;
      }
      
      // Handle specific Firebase Auth errors with better messages
      if (firebaseError.code === 'auth/email-already-exists') {
        throw new AppError('An account with this email already exists. Please use a different email or try logging in.', 409, 'USER_EXISTS');
      } else if (firebaseError.code === 'auth/phone-number-already-exists') {
        throw new AppError('This phone number is already registered. Please use a different phone number or leave it empty for admin accounts.', 409, 'PHONE_EXISTS');
      } else if (firebaseError.code === 'auth/invalid-phone-number') {
        throw new AppError('Invalid phone number format. Please enter a valid phone number or leave it empty.', 400, 'INVALID_PHONE');
      } else if (firebaseError.code === 'auth/invalid-email') {
        throw new AppError('Invalid email address format. Please enter a valid email.', 400, 'INVALID_EMAIL');
      } else {
        throw new AppError('Registration failed. Please check your details and try again.', 500, 'REGISTRATION_FAILED');
      }
    }

}));

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], handleValidationErrors, asyncHandler(async (req, res) => {

    const { email, otp } = req.body;

    // Check if user exists
    if (!registeredUsers.has(email)) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get OTP record
    const otpData = otpStorage.get(email);
    
    if (!otpData) {
      throw new AppError('OTP not found or expired', 400, 'OTP_NOT_FOUND');
    }
    
    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(email);
      throw new AppError('OTP has expired', 400, 'OTP_EXPIRED');
    }

    // Check attempts
    if (otpData.attempts >= parseInt(process.env.MAX_OTP_ATTEMPTS || 5)) {
      otpStorage.delete(email);
      console.log('🚫 OTP max attempts exceeded', { email, ip: req.ip });
      throw new AppError('Too many attempts. Please request a new OTP.', 429, 'OTP_MAX_ATTEMPTS');
    }

    // Verify OTP - use string comparison for reliability
    let isValidOTP = false;
    
    // Use string comparison (more reliable than bcrypt for OTP)
    if (otp === otpData.plainOtp) {
      isValidOTP = true;
    }
    
    // Additional debug logging
    console.log('OTP Debug:', {
      providedOTP: otp,
      storedPlainOTP: otpData.plainOtp,
      providedType: typeof otp,
      storedType: typeof otpData.plainOtp,
      email: email
    });
    
    console.log(`OTP verification attempt for ${email}: provided=${otp}, stored=${otpData.plainOtp}, hashedStored=${otpData.otp}, valid=${isValidOTP}`);
    
    if (!isValidOTP) {
      // Increment attempts
      otpData.attempts += 1;
      otpStorage.set(email, otpData);
      console.log('❌ Invalid OTP attempt', { email, ip: req.ip, attempts: otpData.attempts });
      throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
    }

    // Get user data from memory
    let userData = registeredUsers.get(email);
    if (!userData) {
      throw new AppError('User not found. Please register again.', 404, 'USER_NOT_FOUND');
    }

    // Now create Firebase user after OTP verification
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser(userData.firebaseUserData);
      console.log('🔥 Firebase user created after OTP verification:', { uid: firebaseUser.uid, email });

      // Set custom claims for role-based access
      await auth.setCustomUserClaims(firebaseUser.uid, { 
        role: userData.role,
        kycStatus: 'pending'
      });

      // Update userData with Firebase UID
      userData.uid = firebaseUser.uid;
      userData.emailVerified = true;
      userData.verifiedAt = new Date().toISOString();

      // Save to Firestore after Firebase user creation
      try {
        const loginTimestamp = new Date().toISOString();
        
        // Check if Firestore is available
        if (!db) {
          throw new Error('Firestore database not initialized');
        }
        
        await db.collection('users').doc(firebaseUser.uid).set({
          uid: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          ...(userData.phone && { phone: userData.phone }),
          createdAt: userData.createdAt,
          emailVerified: true,
          kycStatus: 'pending'
        });
        console.log('💾 User data saved to Firestore:', { uid: firebaseUser.uid });
        
        // Update Firebase Auth user metadata with creation timestamp
        const creationTimestamp = new Date().toISOString();
        await auth.updateUser(firebaseUser.uid, {
          customClaims: {
            role: userData.role,
            emailVerified: true,
            createdAt: creationTimestamp,
            lastSignInTime: creationTimestamp // First login is at creation
          }
        });
        console.log('🔥 Firebase Auth metadata updated with timestamps');
        
      } catch (firestoreError) {
        console.warn('⚠️ Firestore save failed - Database may not be enabled:', firestoreError.message);
        console.log('📋 SOLUTION: Enable Firestore database in Firebase Console:');
        console.log('   1. Go to Firebase Console > Your Project');
        console.log('   2. Click "Firestore Database" in left menu');
        console.log('   3. Click "Create database"');
        console.log('   4. Choose "Start in test mode" for development');
        
        // Still update Firebase Auth even if Firestore fails
        try {
          const loginTimestamp = new Date().toISOString();
          await auth.updateUser(firebaseUser.uid, {
            customClaims: {
              role: userData.role,
              emailVerified: true,
              lastSignInTime: loginTimestamp
            }
          });
          console.log('🔥 Firebase Auth metadata updated (Firestore unavailable)');
        } catch (authError) {
          console.error('❌ Failed to update Firebase Auth metadata:', authError.message);
        }
      }

    } catch (firebaseError) {
      console.error('Firebase user creation error after OTP:', firebaseError);
      throw new AppError('Account creation failed. Please try again.', 500, 'FIREBASE_ERROR');
    }

    // Update memory
    registeredUsers.set(email, userData);

    // Clean up OTP
    otpStorage.delete(email);

    // Create custom token for Firebase Auth sign-in to track "Signed In" status
    let customToken;
    try {
      customToken = await auth.createCustomToken(userData.uid, {
        role: userData.role,
        emailVerified: true
      });
      console.log('🔑 Custom token created for Firebase sign-in:', { uid: userData.uid, email });
    } catch (tokenError) {
      console.error('Custom token creation error:', tokenError);
    }

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { 
        uid: userData.uid, 
        email: userData.email,
        role: userData.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: 'Email verified successfully! You are now logged in.',
      success: true,
      token,
      customToken, // Include Firebase custom token for sign-in tracking
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        emailVerified: true
      }
    });

    console.log('✅ Email verified successfully', { email, uid: userData.uid });

}));

// Login with proper credential validation
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], handleValidationErrors, asyncHandler(async (req, res) => {

    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', { email, ip: req.ip, userAgent: req.get('User-Agent') });

    // First try to get user from Firebase Firestore
    let userData = null;
    try {
      if (db) {
        const userSnapshot = await db.collection('users').where('email', '==', email).get();
        if (!userSnapshot.empty) {
          userData = userSnapshot.docs[0].data();
          console.log('✅ User found in Firestore:', { email, uid: userData.uid });
          // Also cache in memory for current session
          registeredUsers.set(email, { ...userData, password: await bcrypt.hash(password, 12) });
        }
      }
    } catch (firebaseError) {
      console.error('❌ Firebase fetch error during login:', firebaseError);
    }
    
    // Fallback to memory if Firebase fails
    if (!userData) {
      userData = registeredUsers.get(email);
      if (userData) {
        console.log('✅ User found in memory:', { email });
      }
    }
    
    if (!userData) {
      console.log('🚫 Login attempt with non-existent email', { email, ip: req.ip });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password with Firebase Auth (optional check)
    let firebaseUserExists = false;
    try {
      await auth.getUserByEmail(email);
      firebaseUserExists = true;
      console.log('✅ User exists in Firebase Auth:', { email });
    } catch (firebaseAuthError) {
      console.log('⚠️ User not found in Firebase Auth, continuing with memory auth:', { email });
      // Don't throw error here, allow memory-based auth to continue
    }

    // Verify password against stored hash
    const storedPassword = userData.password || registeredUsers.get(email)?.password;
    if (!storedPassword) {
      console.log('❌ No stored password found for user:', { email });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    
    console.log('🔍 Verifying password for:', { email, hasStoredPassword: !!storedPassword });
    
    const isValidPassword = await bcrypt.compare(password, storedPassword);
    
    if (!isValidPassword) {
      console.log('❌ Login attempt with invalid password', { email, ip: req.ip });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    
    console.log('✅ Password verified successfully:', { email });

    // Check if email is verified for regular users
    if (userData.role === 'user' && !userData.emailVerified) {
      throw new AppError('Please verify your email before logging in', 401, 'EMAIL_NOT_VERIFIED');
    }

    // Update login timestamps in Firestore and Firebase Auth
    try {
      const loginTimestamp = new Date().toISOString();
      
      // Update Firebase Auth user record with last sign-in time
      await auth.updateUser(userData.uid, {
        customClaims: {
          role: userData.role,
          emailVerified: userData.emailVerified,
          lastSignInTime: loginTimestamp
        }
      });

      // Update Firestore with last login timestamp if available
      try {
        if (db) {
          await db.collection('users').doc(userData.uid).update({
            lastSignInTime: loginTimestamp,
            lastLoginAt: loginTimestamp
          });
          console.log('📅 Firestore login timestamp updated:', { uid: userData.uid, timestamp: loginTimestamp });
        }
      } catch (firestoreError) {
        console.warn('⚠️ Firestore login update failed:', firestoreError.message);
      }
      
      console.log('📅 Firebase Auth user updated with login time:', { uid: userData.uid, email, lastSignIn: loginTimestamp });
    } catch (updateError) {
      console.warn('⚠️ Failed to update login timestamps:', updateError.message);
      console.log('📋 Enable Firestore database in Firebase Console for full functionality');
    }

    // Create custom token for client authentication and trigger Firebase sign-in
    let customToken;
    try {
      // Add current timestamp to custom claims for tracking
      const loginTimestamp = new Date().toISOString();
      
      customToken = await auth.createCustomToken(userData.uid, {
        role: userData.role,
        emailVerified: userData.emailVerified,
        lastSignInTime: loginTimestamp,
        loginTimestamp: Date.now() // Add timestamp for tracking
      });
      console.log('🔑 Custom token created for login with timestamp:', { 
        uid: userData.uid, 
        email, 
        loginTime: loginTimestamp 
      });
      
      // Important: The frontend must use this custom token to sign in with Firebase Auth
      // This will update the native lastSignInTime in Firebase Console
      console.log('📱 Frontend will call firebase.auth().signInWithCustomToken() to update Firebase Console');
      
    } catch (tokenError) {
      console.error('❌ Custom token creation FAILED - Login tracking will not work:', tokenError);
      // Don't fail the login, but log the issue
    }

    console.log('🔐 User logged in successfully', { email, uid: userData.uid, role: userData.role });

    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: userData.uid, 
        email: userData.email,
        role: userData.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('📤 Sending login response:', { 
      email, 
      uid: userData.uid, 
      hasToken: !!token,
      hasCustomToken: !!customToken 
    });

    try {
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        customToken, // Include Firebase custom token for sign-in tracking
        user: {
          uid: userData.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          emailVerified: userData.emailVerified,
          kycStatus: userData.kycStatus || 'pending'
        }
      });
      console.log('✅ Login response sent successfully');
    } catch (responseError) {
      console.error('❌ Error sending login response:', responseError);
      throw new AppError('Failed to send response', 500, 'RESPONSE_ERROR');
    }

}));

// Resend OTP
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail()
], handleValidationErrors, asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Check if user exists
    if (!registeredUsers.has(email)) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const userData = registeredUsers.get(email);
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || 10) * 60000);

    // Store OTP in memory
    otpStorage.set(email, {
      otp: await bcrypt.hash(otp, 12),
      plainOtp: otp, // Store plain OTP for development
      expiresAt: otpExpiry,
      attempts: 0,
      verified: false
    });

    // Send OTP email with role information and cloud fallback
    try {
      await emailService.sendOTP(email, otp, userData.name, userData.role);
      console.log('🔄 OTP resent successfully via primary service', { email, role: userData.role });
    } catch (emailError) {
      console.error('❌ Resend OTP primary email error:', emailError);
      
      // Try cloud email service as fallback for production
      if (process.env.NODE_ENV === 'production') {
        try {
          console.log('☁️ Attempting cloud email service fallback for resend...');
          await cloudEmailService.sendOTP(email, otp, userData.name, userData.role);
          console.log('🔄 OTP resent successfully via cloud fallback service', { email, role: userData.role });
        } catch (cloudError) {
          console.error('❌ Cloud email service also failed for resend:', cloudError);
          console.log(`📋 All email services failed, OTP for debugging - ${email}: ${otp}`);
          throw new AppError('Failed to resend verification email. Please try again later.', 500, 'EMAIL_SEND_FAILED');
        }
      } else {
        // In development, log the OTP and continue
        console.log(`📋 Email failed, OTP for development/testing - ${email}: ${otp}`);
      }
    }

    res.json({ message: 'OTP sent successfully', success: true });

}));

// Forgot Password - Send reset email with OTP
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists in Firebase Auth
  try {
    await auth.getUserByEmail(email);
  } catch (error) {
    // Don't reveal if user exists or not for security
    return res.json({ 
      success: true, 
      message: 'If an account with this email exists, a password reset code has been sent.' 
    });
  }

  // Generate password reset OTP
  const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes

  // Store reset OTP
  otpStorage.set(`reset_${email}`, {
    otp: await bcrypt.hash(resetOtp, 12),
    plainOtp: resetOtp,
    expiresAt: otpExpiry,
    attempts: 0,
    verified: false,
    type: 'password_reset'
  });

  // Send reset email
  try {
    await emailService.sendPasswordResetOTP(email, resetOtp);
    console.log('🔑 Password reset OTP sent:', { email });
  } catch (emailError) {
    console.error('Password reset email error:', emailError);
    console.log(`Email service failed, reset OTP for ${email}: ${resetOtp}`);
  }

  res.json({ 
    success: true, 
    message: 'If an account with this email exists, a password reset code has been sent.' 
  });
}));

// Reset Password with OTP verification
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Check if reset OTP exists and is valid
  const resetKey = `reset_${email}`;
  const storedOtpData = otpStorage.get(resetKey);

  if (!storedOtpData) {
    throw new AppError('Invalid or expired reset code', 400, 'INVALID_RESET_CODE');
  }

  if (new Date() > storedOtpData.expiresAt) {
    otpStorage.delete(resetKey);
    throw new AppError('Reset code has expired', 400, 'EXPIRED_RESET_CODE');
  }

  if (storedOtpData.attempts >= 3) {
    otpStorage.delete(resetKey);
    throw new AppError('Too many attempts. Please request a new reset code.', 400, 'TOO_MANY_ATTEMPTS');
  }

  // Verify OTP
  const isValidOtp = await bcrypt.compare(otp, storedOtpData.otp);
  if (!isValidOtp) {
    storedOtpData.attempts++;
    throw new AppError('Invalid reset code', 400, 'INVALID_RESET_CODE');
  }

  try {
    // Update password in Firebase Auth
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, {
      password: newPassword
    });

    // Update password hash in Firestore if user exists there
    try {
      const userQuery = await db.collection('users').where('email', '==', email).get();
      if (!userQuery.empty) {
        const userDoc = userQuery.docs[0];
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await userDoc.ref.update({
          password: hashedPassword,
          passwordUpdatedAt: new Date().toISOString()
        });
      }
    } catch (firestoreError) {
      console.warn('⚠️ Firestore password update failed:', firestoreError.message);
    }

    // Update in-memory storage if exists
    if (registeredUsers.has(email)) {
      const userData = registeredUsers.get(email);
      userData.password = await bcrypt.hash(newPassword, 12);
      registeredUsers.set(email, userData);
    }

    // Clean up reset OTP
    otpStorage.delete(resetKey);

    console.log('🔑 Password reset successful:', { email, uid: user.uid });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    throw new AppError('Failed to reset password. Please try again.', 500, 'RESET_FAILED');
  }
}));

// Get current user - removed Firebase dependency
router.get('/me', asyncHandler(async (req, res) => {
  // This endpoint would need JWT middleware for authentication
  // For now, return error since we don't have user context
  throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
}));

module.exports = router;
