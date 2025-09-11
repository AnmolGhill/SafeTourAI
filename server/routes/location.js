const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');

// Store user activities with location data
const activities = new Map(); // In production, use database

// POST /api/location/track - Track user location for activities
router.post('/track', verifyFirebaseToken, async (req, res) => {
  try {
    const { lat, lng, activityType, description, timestamp } = req.body;
    const userId = req.user.id;

    if (!lat || !lng || !activityType) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and activity type are required'
      });
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates'
      });
    }

    const activity = {
      id: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: activityType,
      title: getActivityTitle(activityType),
      description: description || getDefaultDescription(activityType),
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      createdAt: new Date()
    };

    // Store activity (in production, save to database)
    if (!activities.has(userId)) {
      activities.set(userId, []);
    }
    activities.get(userId).push(activity);

    // Keep only last 50 activities per user
    const userActivities = activities.get(userId);
    if (userActivities.length > 50) {
      userActivities.splice(0, userActivities.length - 50);
    }

    res.json({
      success: true,
      message: 'Location tracked successfully',
      activity: {
        id: activity.id,
        type: activity.type,
        title: activity.title,
        location: activity.location,
        timestamp: activity.timestamp
      }
    });

  } catch (error) {
    console.error('Error tracking location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track location'
    });
  }
});

// GET /api/location/activities - Get user activities with location data
router.get('/activities', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userActivities = activities.get(userId) || [];

    // Sort by timestamp (newest first)
    const sortedActivities = userActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20); // Return last 20 activities

    res.json({
      success: true,
      activities: sortedActivities
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  }
});

// POST /api/location/emergency - Track emergency location
router.post('/emergency', verifyFirebaseToken, async (req, res) => {
  try {
    const { lat, lng, emergencyType, description } = req.body;
    const userId = req.user.id;

    if (!lat || !lng || !emergencyType) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and emergency type are required'
      });
    }

    const emergencyActivity = {
      id: `EMG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'emergency',
      title: `Emergency: ${emergencyType}`,
      description: description || `Emergency situation reported: ${emergencyType}`,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      timestamp: new Date(),
      priority: 'high',
      emergencyType,
      status: 'active'
    };

    // Store emergency activity
    if (!activities.has(userId)) {
      activities.set(userId, []);
    }
    activities.get(userId).push(emergencyActivity);

    // In production, trigger emergency response system
    console.log(`🚨 EMERGENCY ALERT: ${emergencyType} at ${lat}, ${lng} for user ${userId}`);

    res.json({
      success: true,
      message: 'Emergency location recorded',
      emergency: {
        id: emergencyActivity.id,
        type: emergencyActivity.emergencyType,
        location: emergencyActivity.location,
        timestamp: emergencyActivity.timestamp,
        status: emergencyActivity.status
      }
    });

  } catch (error) {
    console.error('Error recording emergency location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record emergency location'
    });
  }
});

// GET /api/location/nearby - Get nearby activities (for responders)
router.get('/nearby', verifyFirebaseToken, async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // radius in km

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    const nearbyActivities = [];

    // Search through all activities
    for (const [userId, userActivities] of activities.entries()) {
      for (const activity of userActivities) {
        if (activity.location) {
          const distance = calculateDistance(
            userLat, userLng,
            activity.location.lat, activity.location.lng
          );

          if (distance <= searchRadius) {
            nearbyActivities.push({
              ...activity,
              distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
            });
          }
        }
      }
    }

    // Sort by distance
    nearbyActivities.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      activities: nearbyActivities.slice(0, 20), // Return max 20 results
      searchRadius,
      center: { lat: userLat, lng: userLng }
    });

  } catch (error) {
    console.error('Error finding nearby activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find nearby activities'
    });
  }
});

// Helper functions
function getActivityTitle(type) {
  const titles = {
    'welcome': 'Welcome to SafeTourAI',
    'system': 'System Status Check',
    'location': 'Location Update',
    'emergency': 'Emergency Alert',
    'checkin': 'Safety Check-in',
    'alert': 'Safety Alert',
    'blockchain': 'Blockchain Transaction'
  };
  return titles[type] || 'Activity Update';
}

function getDefaultDescription(type) {
  const descriptions = {
    'welcome': 'User successfully logged into SafeTourAI dashboard',
    'system': 'All safety systems are operational and ready',
    'location': 'User location has been updated',
    'emergency': 'Emergency situation reported',
    'checkin': 'User performed safety check-in',
    'alert': 'Safety alert triggered',
    'blockchain': 'Blockchain transaction recorded'
  };
  return descriptions[type] || 'Activity recorded';
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;
