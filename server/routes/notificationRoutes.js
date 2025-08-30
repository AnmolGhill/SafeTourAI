const express = require('express');
const router = express.Router();
const {
  sendFirebaseNotification,
  sendMulticastNotifications,
  sendEmailNotification,
  notifyEmergencyContacts,
  notifyNearbyResponders,
  sendBulkNotifications,
  updateNotificationPreferences
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Send individual notifications
router.post('/firebase', authenticateToken, sendFirebaseNotification);
router.post('/email', authenticateToken, sendEmailNotification);

// Emergency notifications
router.post('/emergency-contacts', authenticateToken, notifyEmergencyContacts);
router.post('/nearby-responders', authenticateToken, notifyNearbyResponders);

// User notification preferences
router.put('/preferences/:userId', authenticateToken, updateNotificationPreferences);

// Admin and Responder routes
router.post('/multicast', authenticateToken, requireRole(['admin', 'responder']), sendMulticastNotifications);

// Admin only routes
router.post('/bulk', authenticateToken, requireRole(['admin']), sendBulkNotifications);

module.exports = router;
