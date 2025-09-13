const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');

// Store notifications (in production, use database)
const notifications = new Map();

// GET /api/notifications - Get user notifications
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid;
    const userNotifications = [];

    for (const [notificationId, notification] of notifications.entries()) {
      if (notification.userId === userId) {
        userNotifications.push(notification);
      }
    }

    // Sort by timestamp (newest first)
    userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      notifications: userNotifications.slice(0, 50) // Return last 50 notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// POST /api/notifications - Create notification
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { title, message, type, priority, targetUserId } = req.body;
    const userId = req.user.id || req.user.uid;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = {
      id: notificationId,
      userId: targetUserId || userId,
      senderId: userId,
      title,
      message,
      type: type || 'info',
      priority: priority || 'normal',
      read: false,
      timestamp: new Date(),
      createdAt: new Date()
    };

    notifications.set(notificationId, notification);

    console.log(`📢 Notification created: ${title} for user ${notification.userId}`);

    res.json({
      success: true,
      message: 'Notification created successfully',
      notification: {
        id: notification.id,
        title: notification.title,
        type: notification.type,
        timestamp: notification.timestamp
      }
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', verifyFirebaseToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id || req.user.uid;

    const notification = notifications.get(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    notification.read = true;
    notification.readAt = new Date();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid;
    let updatedCount = 0;

    for (const [notificationId, notification] of notifications.entries()) {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: `${updatedCount} notifications marked as read`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id || req.user.uid;

    const notification = notifications.get(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    notifications.delete(notificationId);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid;
    let unreadCount = 0;

    for (const [notificationId, notification] of notifications.entries()) {
      if (notification.userId === userId && !notification.read) {
        unreadCount++;
      }
    }

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
});

module.exports = router;
