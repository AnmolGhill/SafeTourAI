const express = require('express');
const router = express.Router();
const {
  register,
  verifyOtp,
  login,
  firebaseLogin,
  resendOtp,
  logout,
  getCurrentUser
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/firebase-login', firebaseLogin);
router.post('/resend-otp', resendOtp);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
