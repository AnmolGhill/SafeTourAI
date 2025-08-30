const express = require('express');
const router = express.Router();
const {
  submitKYC,
  getKYCStatus,
  verifyKYC,
  getPendingKYC,
  getKYCStatistics,
  upload
} = require('../controllers/kycController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// User routes
router.post('/submit', protect, upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), submitKYC);

router.get('/status', protect, getKYCStatus);

// Admin routes
router.get('/pending', protect, authorize('admin'), getPendingKYC);
router.post('/verify/:userId', protect, authorize('admin'), verifyKYC);
router.get('/statistics', protect, authorize('admin'), getKYCStatistics);

module.exports = router;
