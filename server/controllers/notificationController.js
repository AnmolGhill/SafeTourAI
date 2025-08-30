const { sendPushNotification, sendMulticastNotification } = require('../config/firebase');
const { sendOtpEmail, sendEmergencyAlert, sendWelcomeEmail } = require('../utils/sendEmail');
const User = require('../models/User');
const Emergency = require('../models/Emergency');

// Send Firebase push notification
const sendFirebaseNotification = async (req, res) => {
  try {
    const { userId, title, body, data = {} } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User ID, title, and body are required'
      });
    }

    // Get user's Firebase token
    const user = await User.findOne({ userId });
    if (!user || !user.firebaseToken) {
      return res.status(404).json({
        success: false,
        message: 'User not found or no Firebase token available'
      });
    }

    // Check user's notification preferences
    if (!user.preferences.notifications.push) {
      return res.status(400).json({
        success: false,
        message: 'User has disabled push notifications'
      });
    }

    const result = await sendPushNotification(user.firebaseToken, title, body, data);

    res.status(200).json({
      success: true,
      message: 'Push notification sent successfully',
      data: { result }
    });
  } catch (error) {
    console.error('Send Firebase notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send push notification',
      error: error.message
    });
  }
};

// Send multicast notification to multiple users
const sendMulticastNotifications = async (req, res) => {
  try {
    const { userIds, title, body, data = {} } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array, title, and body are required'
      });
    }

    // Get users' Firebase tokens
    const users = await User.find({ 
      userId: { $in: userIds },
      firebaseToken: { $exists: true, $ne: '' },
      'preferences.notifications.push': true
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found with valid Firebase tokens'
      });
    }

    const tokens = users.map(user => user.firebaseToken);
    const result = await sendMulticastNotification(tokens, title, body, data);

    res.status(200).json({
      success: true,
      message: 'Multicast notifications sent successfully',
      data: { 
        result,
        sentTo: users.length,
        totalRequested: userIds.length
      }
    });
  } catch (error) {
    console.error('Send multicast notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send multicast notifications',
      error: error.message
    });
  }
};

// Send email notification
const sendEmailNotification = async (req, res) => {
  try {
    const { email, type, data } = req.body;

    if (!email || !type || !data) {
      return res.status(400).json({
        success: false,
        message: 'Email, type, and data are required'
      });
    }

    let result;

    switch (type) {
      case 'otp':
        if (!data.otp || !data.name) {
          return res.status(400).json({
            success: false,
            message: 'OTP and name are required for OTP email'
          });
        }
        result = await sendOtpEmail(email, data.otp, data.name);
        break;

      case 'emergency':
        if (!data.userName || !data.location || !data.emergencyType) {
          return res.status(400).json({
            success: false,
            message: 'User name, location, and emergency type are required for emergency email'
          });
        }
        result = await sendEmergencyAlert(email, data);
        break;

      case 'welcome':
        if (!data.name) {
          return res.status(400).json({
            success: false,
            message: 'Name is required for welcome email'
          });
        }
        result = await sendWelcomeEmail(email, data.name);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Supported types: otp, emergency, welcome'
        });
    }

    res.status(200).json({
      success: true,
      message: 'Email notification sent successfully',
      data: { result }
    });
  } catch (error) {
    console.error('Send email notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email notification',
      error: error.message
    });
  }
};

// Notify emergency contacts
const notifyEmergencyContacts = async (req, res) => {
  try {
    const { emergencyId } = req.body;

    if (!emergencyId) {
      return res.status(400).json({
        success: false,
        message: 'Emergency ID is required'
      });
    }

    const emergency = await Emergency.findOne({ emergencyId })
      .populate('user', 'name email emergencyContacts');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    const user = emergency.user;
    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No emergency contacts found for this user'
      });
    }

    const results = [];
    const errors = [];

    // Send notifications to all emergency contacts
    for (let i = 0; i < user.emergencyContacts.length; i++) {
      const contact = user.emergencyContacts[i];
      
      try {
        // Send email notification
        const emailResult = await sendEmergencyAlert(contact.email, {
          userName: user.name,
          location: emergency.location.address || `${emergency.location.coordinates[1]}, ${emergency.location.coordinates[0]}`,
          emergencyType: emergency.type,
          timestamp: emergency.createdAt
        });

        results.push({
          contact: contact.name,
          email: contact.email,
          status: 'sent',
          result: emailResult
        });

        // Mark contact as notified
        await emergency.markContactNotified(i);

      } catch (error) {
        console.error(`Failed to notify ${contact.name}:`, error);
        errors.push({
          contact: contact.name,
          email: contact.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Emergency contact notifications processed',
      data: {
        sent: results.length,
        failed: errors.length,
        total: user.emergencyContacts.length,
        results,
        errors
      }
    });
  } catch (error) {
    console.error('Notify emergency contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to notify emergency contacts',
      error: error.message
    });
  }
};

// Notify nearby responders
const notifyNearbyResponders = async (req, res) => {
  try {
    const { longitude, latitude, emergencyType, severity, maxDistance = 10000 } = req.body;

    if (!longitude || !latitude || !emergencyType) {
      return res.status(400).json({
        success: false,
        message: 'Longitude, latitude, and emergency type are required'
      });
    }

    // Find nearby responders
    const responders = await User.findResponders(longitude, latitude, maxDistance);

    if (responders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No responders found in the specified area'
      });
    }

    // Get Firebase tokens of responders who have push notifications enabled
    const eligibleResponders = responders.filter(responder => 
      responder.firebaseToken && responder.preferences.notifications.push
    );

    if (eligibleResponders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No responders with push notifications enabled found'
      });
    }

    const tokens = eligibleResponders.map(responder => responder.firebaseToken);

    // Send multicast notification
    const result = await sendMulticastNotification(
      tokens,
      '🚨 Emergency Alert',
      `${emergencyType} emergency reported nearby. ${severity || 'Medium'} severity.`,
      {
        emergencyType,
        severity: severity || 'medium',
        location: JSON.stringify([longitude, latitude]),
        maxDistance: maxDistance.toString()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Nearby responders notified successfully',
      data: {
        totalResponders: responders.length,
        notified: eligibleResponders.length,
        result
      }
    });
  } catch (error) {
    console.error('Notify nearby responders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to notify nearby responders',
      error: error.message
    });
  }
};

// Send bulk notifications (Admin only)
const sendBulkNotifications = async (req, res) => {
  try {
    const { userIds, title, body, data = {}, channels = ['push'] } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array, title, and body are required'
      });
    }

    const users = await User.find({ userId: { $in: userIds } });
    const results = {
      push: { sent: 0, failed: 0 },
      email: { sent: 0, failed: 0 }
    };

    // Send push notifications
    if (channels.includes('push')) {
      const pushEligibleUsers = users.filter(user => 
        user.firebaseToken && user.preferences.notifications.push
      );

      if (pushEligibleUsers.length > 0) {
        try {
          const tokens = pushEligibleUsers.map(user => user.firebaseToken);
          await sendMulticastNotification(tokens, title, body, data);
          results.push.sent = pushEligibleUsers.length;
        } catch (error) {
          console.error('Bulk push notification error:', error);
          results.push.failed = pushEligibleUsers.length;
        }
      }
    }

    // Send email notifications
    if (channels.includes('email')) {
      const emailEligibleUsers = users.filter(user => 
        user.preferences.notifications.email
      );

      for (const user of emailEligibleUsers) {
        try {
          // For bulk notifications, we'll send a generic notification email
          // You might want to create a specific bulk notification email template
          await sendWelcomeEmail(user.email, user.name); // Using welcome as template
          results.email.sent++;
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
          results.email.failed++;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk notifications sent',
      data: {
        totalUsers: users.length,
        results
      }
    });
  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: error.message
    });
  }
};

// Update user notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    // Check authorization
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update notification preferences'
      });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { 'preferences.notifications': preferences },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        preferences: user.preferences.notifications
      }
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};

module.exports = {
  sendFirebaseNotification,
  sendMulticastNotifications,
  sendEmailNotification,
  notifyEmergencyContacts,
  notifyNearbyResponders,
  sendBulkNotifications,
  updateNotificationPreferences
};
