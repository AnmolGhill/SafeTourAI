const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, db } = require('../config/firebase');
const emailService = require('../services/emailService');
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
        lastLoginAt: null,
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

      // Try to send OTP email
      try {
        await emailService.sendOTP(email, otp, name);
        console.log('📱 OTP sent successfully', { email, role });
      } catch (emailError) {
        console.error('Email service error:', emailError);
        console.log(`Email service failed, OTP for ${email}: ${otp}`);
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
          kycStatus: 'pending',
          lastLoginAt: loginTimestamp,
          lastSignInAt: loginTimestamp,
          firstLogin: true
        });
        console.log('💾 User data saved to Firestore with login timestamp:', { uid: firebaseUser.uid, timestamp: loginTimestamp });
        
        // Update Firebase Auth user metadata to show sign-in
        await auth.updateUser(firebaseUser.uid, {
          customClaims: {
            role: userData.role,
            emailVerified: true,
            lastSignInTime: loginTimestamp
          }
        });
        console.log('🔥 Firebase Auth metadata updated with sign-in time');
        
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

    // First try to get user from Firebase Firestore
    let userData = null;
    try {
      const userSnapshot = await db.collection('users').where('email', '==', email).get();
      if (!userSnapshot.empty) {
        userData = userSnapshot.docs[0].data();
        // Also cache in memory for current session
        registeredUsers.set(email, { ...userData, password: await bcrypt.hash(password, 12) });
      }
    } catch (firebaseError) {
      console.error('Firebase fetch error during login:', firebaseError);
    }
    
    // Fallback to memory if Firebase fails
    if (!userData) {
      userData = registeredUsers.get(email);
    }
    
    if (!userData) {
      console.log('🚫 Login attempt with non-existent email', { email, ip: req.ip });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password with Firebase Auth
    try {
      await auth.getUserByEmail(email);
      // If we reach here, user exists in Firebase Auth
    } catch (firebaseAuthError) {
      console.log('❌ User not found in Firebase Auth', { email });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password against stored hash
    const storedPassword = userData.password || registeredUsers.get(email)?.password;
    if (!storedPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    
    const isValidPassword = await bcrypt.compare(password, storedPassword);
    
    if (!isValidPassword) {
      console.log('❌ Login attempt with invalid password', { email, ip: req.ip });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if email is verified for regular users
    if (userData.role === 'user' && !userData.emailVerified) {
      throw new AppError('Please verify your email before logging in', 401, 'EMAIL_NOT_VERIFIED');
    }

    // Update login timestamps in Firestore and Firebase Auth
    try {
      const loginTimestamp = new Date().toISOString();
      
      // Try to update Firestore user document
      try {
        if (db) {
          await db.collection('users').doc(userData.uid).update({
            lastLoginAt: loginTimestamp,
            lastSignInAt: loginTimestamp,
            firstLogin: false
          });
          console.log('💾 Firestore login timestamps updated');
        }
      } catch (firestoreError) {
        console.warn('⚠️ Firestore update failed - using Firebase Auth only:', firestoreError.message);
      }
      
      // Always update Firebase Auth user record to show "Signed In" status
      await auth.updateUser(userData.uid, {
        customClaims: {
          role: userData.role,
          emailVerified: userData.emailVerified,
          lastSignInTime: loginTimestamp
        }
      });
      
      console.log('📅 Firebase Auth sign-in timestamp updated:', { uid: userData.uid, email, timestamp: loginTimestamp });
    } catch (updateError) {
      console.warn('⚠️ Failed to update login timestamps:', updateError.message);
      console.log('📋 Enable Firestore database in Firebase Console for full functionality');
    }

    // Create custom token for client authentication
    let customToken;
    try {
      customToken = await auth.createCustomToken(userData.uid, {
        role: userData.role,
        emailVerified: userData.emailVerified,
        lastSignInTime: new Date().toISOString()
      });
      console.log('🔑 Custom token created for login:', { uid: userData.uid, email });
    } catch (tokenError) {
      console.error('Custom token creation error:', tokenError);
    }

    console.log('🔐 User logged in successfully', { email, uid: userData.uid, role: userData.role });

    // Generate JWT token
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
      message: 'Login successful',
      success: true,
      token,
      customToken,
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        emailVerified: userData.emailVerified
      }
    });

    console.log('🔐 User logged in successfully', { email, uid: userData.uid, role: userData.role });

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

    // Send OTP email
    try {
      await emailService.sendOTP(email, otp, userData.name);
      console.log('🔄 OTP resent successfully', { email });
    } catch (emailError) {
      console.error('Resend OTP email error:', emailError);
      console.log(`Email service failed, OTP for ${email}: ${otp}`);
    }

    res.json({ message: 'OTP sent successfully', success: true });

}));

// Get current user - removed Firebase dependency
router.get('/me', asyncHandler(async (req, res) => {
  // This endpoint would need JWT middleware for authentication
  // For now, return error since we don't have user context
  throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
}));

module.exports = router;
