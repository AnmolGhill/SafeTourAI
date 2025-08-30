const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateLocation,
  getNearbyUsers,
  getNearbyResponders,
  addEmergencyContact,
  removeEmergencyContact,
  getDashboard,
  getAllUsers,
  updateUserRole
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Protected routes - User profile management
router.get('/:userId', authenticateToken, getProfile);
router.put('/:userId', authenticateToken, updateProfile);
router.put('/:userId/location', authenticateToken, updateLocation);
router.get('/:userId/dashboard', authenticateToken, getDashboard);

// Emergency contacts management
router.post('/:userId/emergency-contacts', authenticateToken, addEmergencyContact);
router.delete('/:userId/emergency-contacts/:contactId', authenticateToken, removeEmergencyContact);

// Location-based queries
router.get('/nearby/users', authenticateToken, getNearbyUsers);
router.get('/nearby/responders', authenticateToken, getNearbyResponders);

// Admin only routes
router.get('/', authenticateToken, requireRole(['admin']), getAllUsers);
router.put('/:userId/role', authenticateToken, requireRole(['admin']), updateUserRole);

module.exports = router;
