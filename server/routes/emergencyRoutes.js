const express = require('express');
const router = express.Router();
const {
  createEmergency,
  getUserEmergencies,
  getAllEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  assignResponder,
  getNearbyEmergencies,
  getEmergencyStatistics
} = require('../controllers/emergencyController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Create emergency (SOS)
router.post('/create', authenticateToken, createEmergency);

// Get emergencies
router.get('/user/:userId', authenticateToken, getUserEmergencies);
router.get('/nearby', authenticateToken, getNearbyEmergencies);
router.get('/:emergencyId', authenticateToken, getEmergencyById);

// Update emergency
router.put('/:emergencyId/status', authenticateToken, updateEmergencyStatus);

// Responder and Admin routes
router.get('/', authenticateToken, requireRole(['admin', 'responder']), getAllEmergencies);
router.post('/:emergencyId/assign-responder', authenticateToken, requireRole(['admin', 'responder']), assignResponder);

// Admin only routes
router.get('/admin/statistics', authenticateToken, requireRole(['admin']), getEmergencyStatistics);

module.exports = router;
