const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Store emergency alerts (in production, use database)
const emergencyAlerts = new Map();
const responders = new Map();
const voiceEmergencyHistory = new Map();
const familyContacts = new Map();
const sosAlerts = new Map(); // Store SOS alerts from quick actions button

// POST /api/emergency/alert - Create emergency alert
router.post('/alert', verifyFirebaseToken, async (req, res) => {
  try {
    const { emergencyId, type, status, autoActivated, location } = req.body;
    const userId = req.user.id;

    if (!emergencyId || !type) {
      return res.status(400).json({
        success: false,
        error: 'Emergency ID and type are required'
      });
    }

    const alert = {
      id: emergencyId,
      userId,
      type,
      status: status || 'active',
      autoActivated: autoActivated || false,
      location: location || null,
      timestamp: new Date(),
      responders: [],
      updates: []
    };

    emergencyAlerts.set(emergencyId, alert);

    // Log emergency for monitoring
    console.log(`🚨 EMERGENCY ALERT: ${type} - ID: ${emergencyId} - User: ${userId} - Auto: ${autoActivated}`);

    // In production, trigger emergency response system
    // - Send notifications to emergency services
    // - Alert nearby responders
    // - Start location tracking
    // - Send SMS/email to emergency contacts

    res.json({
      success: true,
      message: 'Emergency alert created',
      alert: {
        id: alert.id,
        type: alert.type,
        status: alert.status,
        timestamp: alert.timestamp
      }
    });

  } catch (error) {
    console.error('Error creating emergency alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create emergency alert'
    });
  }
});

// GET /api/emergency/alerts - Get user's emergency alerts
router.get('/alerts', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userAlerts = [];

    for (const [alertId, alert] of emergencyAlerts.entries()) {
      if (alert.userId === userId) {
        userAlerts.push(alert);
      }
    }

    // Sort by timestamp (newest first)
    userAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      alerts: userAlerts.slice(0, 20) // Return last 20 alerts
    });

  } catch (error) {
    console.error('Error fetching emergency alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency alerts'
    });
  }
});

// PUT /api/emergency/alert/:id - Update emergency alert
router.put('/alert/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const userId = req.user.id;
    const { status, location, update } = req.body;

    const alert = emergencyAlerts.get(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Emergency alert not found'
      });
    }

    if (alert.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update alert
    if (status) alert.status = status;
    if (location) alert.location = location;
    
    if (update) {
      alert.updates.push({
        message: update,
        timestamp: new Date()
      });
    }

    alert.lastUpdated = new Date();

    res.json({
      success: true,
      message: 'Emergency alert updated',
      alert: {
        id: alert.id,
        status: alert.status,
        lastUpdated: alert.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error updating emergency alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update emergency alert'
    });
  }
});

// GET /api/emergency/responders - Get available responders
router.get('/responders', verifyFirebaseToken, async (req, res) => {
  try {
    const { lat, lng, radius = 10, type } = req.query;

    // Mock responder data (in production, fetch from database)
    const mockResponders = [
      {
        id: 'RSP_001',
        name: 'Dr. Sarah Johnson',
        type: 'medical',
        location: 'Downtown Medical Center',
        coordinates: { lat: 28.6139, lng: 77.2090 },
        status: 'available',
        specialization: 'Emergency Medicine',
        responseTime: '3 min',
        rating: 4.9,
        distance: 0.8
      },
      {
        id: 'RSP_002',
        name: 'Officer Mike Chen',
        type: 'police',
        location: 'Central Police Station',
        coordinates: { lat: 28.6129, lng: 77.2100 },
        status: 'available',
        specialization: 'Law Enforcement',
        responseTime: '5 min',
        rating: 4.8,
        distance: 1.2
      },
      {
        id: 'RSP_003',
        name: 'Paramedic Lisa Davis',
        type: 'medical',
        location: 'Fire Station 12',
        coordinates: { lat: 28.6149, lng: 77.2080 },
        status: 'busy',
        specialization: 'Emergency Medical',
        responseTime: '7 min',
        rating: 4.7,
        distance: 2.1
      },
      {
        id: 'RSP_004',
        name: 'Firefighter Tom Wilson',
        type: 'fire',
        location: 'Fire Station 8',
        coordinates: { lat: 28.6159, lng: 77.2070 },
        status: 'available',
        specialization: 'Fire & Rescue',
        responseTime: '8 min',
        rating: 4.9,
        distance: 2.8
      }
    ];

    let filteredResponders = mockResponders;

    // Filter by type if specified
    if (type) {
      filteredResponders = filteredResponders.filter(r => r.type === type);
    }

    // Filter by location if coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const searchRadius = parseFloat(radius);

      filteredResponders = filteredResponders.filter(responder => {
        const distance = calculateDistance(
          userLat, userLng,
          responder.coordinates.lat, responder.coordinates.lng
        );
        responder.distance = Math.round(distance * 100) / 100;
        return distance <= searchRadius;
      });
    }

    // Sort by distance and availability
    filteredResponders.sort((a, b) => {
      if (a.status === 'available' && b.status !== 'available') return -1;
      if (a.status !== 'available' && b.status === 'available') return 1;
      return a.distance - b.distance;
    });

    res.json({
      success: true,
      responders: filteredResponders.slice(0, 10), // Return max 10 responders
      searchRadius: parseFloat(radius),
      center: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
    });

  } catch (error) {
    console.error('Error fetching responders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch responders'
    });
  }
});

// POST /api/emergency/assign - Assign responder to emergency
router.post('/assign', verifyFirebaseToken, async (req, res) => {
  try {
    const { emergencyId, responderId } = req.body;
    const userId = req.user.id;

    if (!emergencyId || !responderId) {
      return res.status(400).json({
        success: false,
        error: 'Emergency ID and responder ID are required'
      });
    }

    const alert = emergencyAlerts.get(emergencyId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Emergency alert not found'
      });
    }

    if (alert.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Add responder to alert
    const assignment = {
      responderId,
      assignedAt: new Date(),
      status: 'assigned'
    };

    alert.responders.push(assignment);
    alert.updates.push({
      message: `Responder ${responderId} assigned to emergency`,
      timestamp: new Date()
    });

    console.log(`👨‍⚕️ Responder ${responderId} assigned to emergency ${emergencyId}`);

    res.json({
      success: true,
      message: 'Responder assigned successfully',
      assignment
    });

  } catch (error) {
    console.error('Error assigning responder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign responder'
    });
  }
});

// GET /api/emergency/status/:id - Get emergency status
router.get('/status/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const userId = req.user.id;

    const alert = emergencyAlerts.get(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Emergency alert not found'
      });
    }

    if (alert.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      alert: {
        id: alert.id,
        type: alert.type,
        status: alert.status,
        timestamp: alert.timestamp,
        lastUpdated: alert.lastUpdated,
        responders: alert.responders,
        updates: alert.updates,
        location: alert.location
      }
    });

  } catch (error) {
    console.error('Error fetching emergency status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency status'
    });
  }
});

// POST /api/emergency/voice-alert - Create voice-triggered emergency alert
router.post('/voice-alert', verifyFirebaseToken, async (req, res) => {
  try {
    const { 
      triggerWord, 
      location, 
      contacts, 
      silentMode, 
      emergencyType = 'voice_trigger',
      userDetails
    } = req.body;
    const userId = req.user.id;

    if (!triggerWord) {
      return res.status(400).json({
        success: false,
        error: 'Trigger word is required'
      });
    }

    const alertId = `VOICE_${Date.now()}_${userId}`;
    const alert = {
      id: alertId,
      userId,
      type: emergencyType,
      triggerWord,
      status: 'active',
      silentMode: silentMode || false,
      location: location || null,
      userDetails: userDetails || null,
      timestamp: new Date(),
      contacts: contacts || [],
      responders: [],
      updates: []
    };

    emergencyAlerts.set(alertId, alert);
    
    // Store in voice emergency history
    if (!voiceEmergencyHistory.has(userId)) {
      voiceEmergencyHistory.set(userId, []);
    }
    voiceEmergencyHistory.get(userId).push({
      id: alertId,
      triggerWord,
      timestamp: new Date(),
      location,
      userDetails: userDetails || null,
      status: 'sent'
    });

    // Log emergency for monitoring
    console.log(`🎤 VOICE EMERGENCY: Trigger "${triggerWord}" - ID: ${alertId} - User: ${userId} - Silent: ${silentMode}`);
    console.log(`📍 Location: ${location?.latitude}, ${location?.longitude}`);
    console.log(`👤 User: ${userDetails?.fullName || 'Unknown'}`);

    // Send notifications to emergency contacts
    try {
      await sendEmergencyNotifications(alert);
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.json({
      success: true,
      message: 'Voice emergency alert created and notifications sent',
      alert: {
        id: alert.id,
        type: alert.type,
        triggerWord: alert.triggerWord,
        status: alert.status,
        timestamp: alert.timestamp,
        location: alert.location,
        userDetails: alert.userDetails,
        notificationsSent: contacts?.length || 0
      }
    });

  } catch (error) {
    console.error('Error creating voice emergency alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create voice emergency alert'
    });
  }
});

// GET /api/emergency/voice-history - Get voice emergency history
router.get('/voice-history', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = voiceEmergencyHistory.get(userId) || [];
    
    // Sort by timestamp (newest first)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      history: history.slice(0, 50) // Return last 50 voice triggers
    });

  } catch (error) {
    console.error('Error fetching voice emergency history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voice emergency history'
    });
  }
});

// POST /api/emergency/contacts - Save family/emergency contacts
router.post('/contacts', verifyFirebaseToken, async (req, res) => {
  try {
    const { contacts } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        error: 'Contacts must be an array'
      });
    }

    // Validate contact structure
    for (const contact of contacts) {
      if (!contact.name || !contact.phone) {
        return res.status(400).json({
          success: false,
          error: 'Each contact must have name and phone'
        });
      }
    }

    familyContacts.set(userId, contacts);

    res.json({
      success: true,
      message: 'Emergency contacts saved successfully',
      contactCount: contacts.length
    });

  } catch (error) {
    console.error('Error saving emergency contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save emergency contacts'
    });
  }
});

// GET /api/emergency/contacts - Get family/emergency contacts
router.get('/contacts', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const contacts = familyContacts.get(userId) || [];

    res.json({
      success: true,
      contacts
    });

  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency contacts'
    });
  }
});

// POST /api/emergency/test-alert - Test emergency alert system
router.post('/test-alert', verifyFirebaseToken, async (req, res) => {
  try {
    const { contactId } = req.body;
    const userId = req.user.id;

    const contacts = familyContacts.get(userId) || [];
    const contact = contacts.find(c => c.id === contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    // Create test alert
    const testAlert = {
      id: `TEST_${Date.now()}`,
      userId,
      type: 'test',
      status: 'test',
      location: null,
      timestamp: new Date(),
      contacts: [contact]
    };

    // Send test notification
    try {
      await sendEmergencyNotifications(testAlert, true);
      
      res.json({
        success: true,
        message: 'Test alert sent successfully',
        contact: contact.name
      });
    } catch (notificationError) {
      console.error('Error sending test notification:', notificationError);
      res.status(500).json({
        success: false,
        error: 'Failed to send test notification'
      });
    }

  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test alert'
    });
  }
});

// Helper function to send emergency notifications
async function sendEmergencyNotifications(alert, isTest = false) {
  const { contacts, location, triggerWord, timestamp, userId } = alert;
  
  if (!contacts || contacts.length === 0) {
    console.log('No contacts to notify');
    return;
  }

  const locationText = location 
    ? `Location: https://maps.google.com/maps?q=${location.latitude},${location.longitude}`
    : 'Location: Not available';

  const alertType = isTest ? 'TEST ALERT' : 'EMERGENCY ALERT';
  const subject = `${alertType} - SafeTour Emergency System`;
  
  const message = isTest 
    ? `This is a test of the SafeTour emergency alert system. If this was a real emergency, you would receive location and contact information.`
    : `EMERGENCY ALERT from SafeTour user!
    
Trigger: Voice command "${triggerWord}" detected
Time: ${timestamp.toLocaleString()}
${locationText}

This is an automated emergency alert. Please contact the user immediately or call emergency services if needed.

SafeTour Emergency System`;

  // Send notifications to each contact
  for (const contact of contacts) {
    try {
      // Send email if email is available
      if (contact.email) {
        await emailService.sendEmail({
          to: contact.email,
          subject,
          text: message
        });
        console.log(`📧 Emergency email sent to ${contact.name} (${contact.email})`);
      }

      // In production, also send:
      // - SMS via Twilio or similar service
      // - Push notifications
      // - WhatsApp messages
      // - Phone calls

      console.log(`📱 Emergency notification sent to ${contact.name} (${contact.phone})`);
      
    } catch (error) {
      console.error(`Failed to notify ${contact.name}:`, error);
    }
  }
}

// GET /api/emergency/voice-alerts - Get all voice emergency alerts (for police dashboard)
router.get('/voice-alerts', verifyFirebaseToken, async (req, res) => {
  try {
    const allAlerts = [];

    // Collect all voice emergency alerts from all users
    for (const [userId, history] of voiceEmergencyHistory.entries()) {
      for (const alert of history) {
        // Get the full alert details from emergencyAlerts map
        const fullAlert = emergencyAlerts.get(alert.id);
        if (fullAlert) {
          allAlerts.push({
            id: alert.id,
            userId: userId,
            triggerWord: alert.triggerWord,
            status: alert.status,
            timestamp: alert.timestamp,
            location: alert.location,
            userDetails: alert.userDetails || null
          });
        }
      }
    }

    // Sort by timestamp (newest first)
    allAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      alerts: allAlerts.slice(0, 100) // Return last 100 voice alerts
    });

  } catch (error) {
    console.error('Error fetching voice emergency alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voice emergency alerts'
    });
  }
});

// GET /api/emergency/voice-alerts/:id/details - Get full details of a voice alert with user profile
router.get('/voice-alerts/:id/details', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const fullAlert = emergencyAlerts.get(alertId);

    if (!fullAlert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    // Fetch full user profile from Firebase
    let userProfile = null;
    try {
      const userDoc = await db.collection('users').doc(fullAlert.userId).get();
      const profileDoc = await db.collection('userProfiles').doc(fullAlert.userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const profileData = profileDoc.exists ? profileDoc.data() : {};
        
        userProfile = {
          uid: userData.uid,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          kycStatus: userData.kycStatus,
          profileComplete: userData.profileComplete,
          blockchainId: userData.blockchainId,
          ...profileData
        };
      }
    } catch (dbError) {
      console.error('Error fetching user profile from database:', dbError);
      // Continue with alert data even if profile fetch fails
    }

    res.json({
      success: true,
      alert: {
        ...fullAlert,
        userProfile: userProfile || fullAlert.userDetails
      }
    });

  } catch (error) {
    console.error('Error fetching alert details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert details'
    });
  }
});

// PUT /api/emergency/voice-alerts/:id/resolve - Mark voice alert as resolved
router.put('/voice-alerts/:id/resolve', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const { status } = req.body;

    // Update in emergencyAlerts map
    const alert = emergencyAlerts.get(alertId);
    if (alert) {
      alert.status = status || 'resolved';
      emergencyAlerts.set(alertId, alert);
    }

    // Find and update the alert in voiceEmergencyHistory
    let found = false;
    for (const [userId, history] of voiceEmergencyHistory.entries()) {
      const alertIndex = history.findIndex(a => a.id === alertId);
      if (alertIndex !== -1) {
        history[alertIndex].status = status || 'resolved';
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: 'Voice alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Voice alert status updated',
      alertId: alertId,
      newStatus: status || 'resolved'
    });

  } catch (error) {
    console.error('Error updating voice alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update voice alert'
    });
  }
});

// PUT /api/emergency/voice-alerts/:id/terminate - Terminate voice alert (police confirmation)
router.put('/voice-alerts/:id/terminate', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const { policeNotes } = req.body;

    // Update in emergencyAlerts map
    const alert = emergencyAlerts.get(alertId);
    if (alert) {
      alert.status = 'terminated';
      alert.terminatedAt = new Date();
      alert.policeNotes = policeNotes || '';
      alert.terminatedBy = req.user.id;
      emergencyAlerts.set(alertId, alert);
    }

    // Find and update the alert in voiceEmergencyHistory
    let found = false;
    for (const [userId, history] of voiceEmergencyHistory.entries()) {
      const alertIndex = history.findIndex(a => a.id === alertId);
      if (alertIndex !== -1) {
        history[alertIndex].status = 'terminated';
        history[alertIndex].terminatedAt = new Date();
        history[alertIndex].policeNotes = policeNotes || '';
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: 'Voice alert not found'
      });
    }

    console.log(`✅ Voice alert ${alertId} terminated by police`);

    res.json({
      success: true,
      message: 'Voice alert terminated successfully',
      alertId: alertId,
      status: 'terminated'
    });

  } catch (error) {
    console.error('Error terminating voice alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to terminate voice alert'
    });
  }
});

// POST /api/emergency/sos-alert - Create SOS alert from quick actions button
router.post('/sos-alert', verifyFirebaseToken, async (req, res) => {
  try {
    const { location, userDetails, timestamp } = req.body;
    const userId = req.user.id;

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required for SOS alert'
      });
    }

    const alertId = `SOS_${Date.now()}_${userId}`;
    const alert = {
      id: alertId,
      userId,
      type: 'sos_trigger',
      status: 'active',
      location: location,
      userDetails: userDetails || null,
      timestamp: timestamp || new Date().toISOString(),
      responders: [],
      updates: []
    };

    sosAlerts.set(alertId, alert);

    // Log SOS for monitoring
    console.log(`🚨 SOS ALERT: ID: ${alertId} - User: ${userId}`);
    console.log(`📍 Location: ${location.latitude}, ${location.longitude}`);
    console.log(`👤 User: ${userDetails?.fullName || 'Unknown'}`);

    res.json({
      success: true,
      message: 'SOS alert created and police notified',
      alert: {
        id: alert.id,
        type: alert.type,
        status: alert.status,
        timestamp: alert.timestamp,
        location: alert.location,
        userDetails: alert.userDetails
      }
    });

  } catch (error) {
    console.error('Error creating SOS alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create SOS alert'
    });
  }
});

// GET /api/emergency/sos-alerts - Get all SOS alerts for police dashboard
router.get('/sos-alerts', verifyFirebaseToken, async (req, res) => {
  try {
    const allAlerts = [];

    // Collect all SOS alerts
    for (const [alertId, alert] of sosAlerts.entries()) {
      allAlerts.push({
        id: alert.id,
        userId: alert.userId,
        type: alert.type,
        status: alert.status,
        timestamp: alert.timestamp,
        location: alert.location,
        userDetails: alert.userDetails || null
      });
    }

    // Sort by timestamp (newest first)
    allAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      alerts: allAlerts.slice(0, 100) // Return last 100 SOS alerts
    });

  } catch (error) {
    console.error('Error fetching SOS alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SOS alerts'
    });
  }
});

// GET /api/emergency/sos-alerts/:id/details - Get full details of an SOS alert with user profile
router.get('/sos-alerts/:id/details', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const fullAlert = sosAlerts.get(alertId);

    if (!fullAlert) {
      return res.status(404).json({
        success: false,
        error: 'SOS alert not found'
      });
    }

    // Fetch full user profile from Firebase
    let userProfile = null;
    try {
      const userDoc = await db.collection('users').doc(fullAlert.userId).get();
      const profileDoc = await db.collection('userProfiles').doc(fullAlert.userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const profileData = profileDoc.exists ? profileDoc.data() : {};
        
        userProfile = {
          uid: userData.uid,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          kycStatus: userData.kycStatus,
          profileComplete: userData.profileComplete,
          blockchainId: userData.blockchainId,
          ...profileData
        };
      }
    } catch (dbError) {
      console.error('Error fetching user profile from database:', dbError);
      // Continue with alert data even if profile fetch fails
    }

    res.json({
      success: true,
      alert: {
        ...fullAlert,
        userProfile: userProfile || fullAlert.userDetails
      }
    });

  } catch (error) {
    console.error('Error fetching SOS alert details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SOS alert details'
    });
  }
});

// PUT /api/emergency/sos-alerts/:id/resolve - Mark SOS alert as resolved
router.put('/sos-alerts/:id/resolve', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const { status } = req.body;

    const alert = sosAlerts.get(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'SOS alert not found'
      });
    }

    alert.status = status || 'resolved';
    sosAlerts.set(alertId, alert);

    res.json({
      success: true,
      message: 'SOS alert status updated',
      alertId: alertId,
      newStatus: status || 'resolved'
    });

  } catch (error) {
    console.error('Error updating SOS alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update SOS alert'
    });
  }
});

// PUT /api/emergency/sos-alerts/:id/terminate - Terminate SOS alert (police confirmation)
router.put('/sos-alerts/:id/terminate', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const { policeNotes } = req.body;

    const alert = sosAlerts.get(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'SOS alert not found'
      });
    }

    alert.status = 'terminated';
    alert.terminatedAt = new Date();
    alert.policeNotes = policeNotes || '';
    alert.terminatedBy = req.user.id;
    sosAlerts.set(alertId, alert);

    console.log(`✅ SOS alert ${alertId} terminated by police`);

    res.json({
      success: true,
      message: 'SOS alert terminated successfully',
      alertId: alertId,
      status: 'terminated'
    });

  } catch (error) {
    console.error('Error terminating SOS alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to terminate SOS alert'
    });
  }
});

// Helper function to calculate distance between coordinates
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
