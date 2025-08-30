const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getUserTransactions,
  getAllTransactions,
  getTransactionByHash,
  getEmergencyTransactions,
  getBlockchainHistory,
  validateBlockchainIntegrity,
  getTransactionStatistics,
  verifyTransaction,
  sendExternalTransaction
} = require('../controllers/blockchainController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Create blockchain transaction
router.post('/transaction', authenticateToken, createTransaction);

// Get transactions
router.get('/user/:userId', authenticateToken, getUserTransactions);
router.get('/emergency/:emergencyId', authenticateToken, getEmergencyTransactions);
router.get('/hash/:hash', authenticateToken, getTransactionByHash);

// Verify transaction
router.post('/verify/:transactionId', authenticateToken, requireRole(['admin', 'responder']), verifyTransaction);

// External blockchain integration
router.post('/external', authenticateToken, requireRole(['admin']), sendExternalTransaction);

// Admin only routes
router.get('/', authenticateToken, requireRole(['admin']), getAllTransactions);
router.get('/admin/history', authenticateToken, requireRole(['admin']), getBlockchainHistory);
router.get('/admin/validate', authenticateToken, requireRole(['admin']), validateBlockchainIntegrity);
router.get('/admin/statistics', authenticateToken, requireRole(['admin']), getTransactionStatistics);

module.exports = router;
