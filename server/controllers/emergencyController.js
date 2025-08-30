const Emergency = require('../models/Emergency');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { addTransaction } = require('../config/blockchain');
const { sendEmergencyAlert } = require('../utils/sendEmail');
const { sendPushNotification, sendMulticastNotification } = require('../config/firebase');

// Create emergency
const createEmergency = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, severity, description, location, media } = req.body;

    if (!type || !location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Emergency type and location coordinates are required'
      });
    }

    // Get user details
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create emergency
    const emergency = new Emergency({
      userId,
      type,
      severity: severity || 'medium',
      description: description || '',
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address || ''
      },
      familyContacts: user.emergencyContacts || [],
      media: media || []
    });

    await emergency.save();

    // Add timeline entry
    await emergency.addTimelineEntry('Emergency created', userId, `${type} emergency reported`);

    // Record transaction on blockchain
    try {
      const transactionData = {
        userId,
        emergencyId: emergency.emergencyId,
        action: 'emergency_created',
        location: location.coordinates,
        type,
        severity,
        timestamp: new Date()
      };

      const blockResult = await addTransaction(transactionData);
      
      // Save transaction to database
      const transaction = new Transaction({
        userId,
        emergencyId: emergency.emergencyId,
        transactionType: 'emergency_created',
        blockchainHash: blockResult.blockHash,
        blockIndex: blockResult.blockIndex,
        details: {
          action: 'emergency_created',
          description: `Emergency ${type} created`,
          metadata: { type, severity, location: location.coordinates },
          location: {
            type: 'Point',
            coordinates: location.coordinates
          },
          timestamp: new Date()
        },
        status: 'confirmed'
      });

      await transaction.save();
    } catch (blockchainError) {
      console.error('Blockchain transaction failed:', blockchainError);
    }

    // Send notifications to emergency contacts
    if (user.emergencyContacts && user.emergencyContacts.length > 0) {
      for (let i = 0; i < user.emergencyContacts.length; i++) {
        const contact = user.emergencyContacts[i];
        try {
          await sendEmergencyAlert(contact.email, {
            userName: user.name,
            location: location.address || `${location.coordinates[1]}, ${location.coordinates[0]}`,
            emergencyType: type,
            timestamp: emergency.createdAt
          });
          
          await emergency.markContactNotified(i);
        } catch (emailError) {
          console.error(`Failed to send email to ${contact.email}:`, emailError);
        }
      }
    }

    // Find and notify nearby responders
    try {
      const nearbyResponders = await User.findResponders(
        location.coordinates[0],
        location.coordinates[1],
        10000 // 10km radius
      );

      if (nearbyResponders.length > 0) {
        const responderTokens = nearbyResponders
          .filter(responder => responder.firebaseToken)
          .map(responder => responder.firebaseToken);

        if (responderTokens.length > 0) {
          await sendMulticastNotification(
            responderTokens,
            '🚨 Emergency Alert',
            `${type} emergency reported nearby. Immediate assistance needed.`,
            {
              emergencyId: emergency.emergencyId,
              type,
              severity,
              location: JSON.stringify(location.coordinates)
            }
          );
        }
      }
    } catch (notificationError) {
      console.error('Failed to notify responders:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Emergency created successfully',
      data: {
        emergency: {
          emergencyId: emergency.emergencyId,
          type: emergency.type,
          severity: emergency.severity,
          status: emergency.status,
          location: emergency.location,
          description: emergency.description,
          createdAt: emergency.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emergency',
      error: error.message
    });
  }
};

// Get user emergencies
const getUserEmergencies = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status, type } = req.query;

    // Check authorization
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access these emergencies'
      });
    }

    const filter = { userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const emergencies = await Emergency.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email phone');

    const total = await Emergency.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        emergencies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalEmergencies: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user emergencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergencies',
      error: error.message
    });
  }
};

// Get all emergencies (Admin/Responder only)
const getAllEmergencies = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type, severity } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const emergencies = await Emergency.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email phone location');

    const total = await Emergency.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        emergencies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalEmergencies: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all emergencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergencies',
      error: error.message
    });
  }
};

// Get emergency by ID
const getEmergencyById = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const emergency = await Emergency.findOne({ emergencyId })
      .populate('user', 'name email phone location')
      .populate('responderDetails', 'name email phone role');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    // Check authorization
    if (req.user.userId !== emergency.userId && 
        req.user.role !== 'admin' && 
        req.user.role !== 'responder') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this emergency'
      });
    }

    res.status(200).json({
      success: true,
      data: { emergency }
    });
  } catch (error) {
    console.error('Get emergency by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency',
      error: error.message
    });
  }
};

// Update emergency status
const updateEmergencyStatus = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { status, resolution } = req.body;

    if (!['active', 'responded', 'resolved', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const emergency = await Emergency.findOne({ emergencyId });
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    // Check authorization
    if (req.user.userId !== emergency.userId && 
        req.user.role !== 'admin' && 
        req.user.role !== 'responder') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this emergency'
      });
    }

    await emergency.updateStatus(status, req.user.userId, resolution);

    // Record transaction on blockchain
    try {
      const transactionData = {
        userId: emergency.userId,
        emergencyId,
        action: 'status_updated',
        newStatus: status,
        updatedBy: req.user.userId,
        timestamp: new Date()
      };

      const blockResult = await addTransaction(transactionData);
      
      const transaction = new Transaction({
        userId: emergency.userId,
        emergencyId,
        transactionType: 'emergency_updated',
        blockchainHash: blockResult.blockHash,
        blockIndex: blockResult.blockIndex,
        details: {
          action: 'status_updated',
          description: `Emergency status changed to ${status}`,
          metadata: { oldStatus: emergency.status, newStatus: status, updatedBy: req.user.userId },
          timestamp: new Date()
        },
        status: 'confirmed'
      });

      await transaction.save();
    } catch (blockchainError) {
      console.error('Blockchain transaction failed:', blockchainError);
    }

    res.status(200).json({
      success: true,
      message: 'Emergency status updated successfully',
      data: { emergency }
    });
  } catch (error) {
    console.error('Update emergency status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency status',
      error: error.message
    });
  }
};

// Assign responder to emergency
const assignResponder = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { responderId, estimatedArrival } = req.body;

    const emergency = await Emergency.findOne({ emergencyId });
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    // Verify responder exists and has responder role
    const responder = await User.findOne({ userId: responderId, role: 'responder' });
    if (!responder) {
      return res.status(404).json({
        success: false,
        message: 'Responder not found'
      });
    }

    await emergency.assignResponder(responderId, estimatedArrival);

    // Record transaction on blockchain
    try {
      const transactionData = {
        userId: emergency.userId,
        emergencyId,
        action: 'responder_assigned',
        responderId,
        assignedBy: req.user.userId,
        timestamp: new Date()
      };

      const blockResult = await addTransaction(transactionData);
      
      const transaction = new Transaction({
        userId: emergency.userId,
        emergencyId,
        transactionType: 'responder_assigned',
        blockchainHash: blockResult.blockHash,
        blockIndex: blockResult.blockIndex,
        details: {
          action: 'responder_assigned',
          description: `Responder ${responder.name} assigned to emergency`,
          metadata: { responderId, responderName: responder.name, assignedBy: req.user.userId },
          timestamp: new Date()
        },
        status: 'confirmed'
      });

      await transaction.save();
    } catch (blockchainError) {
      console.error('Blockchain transaction failed:', blockchainError);
    }

    // Notify responder
    if (responder.firebaseToken) {
      try {
        await sendPushNotification(
          responder.firebaseToken,
          'Emergency Assignment',
          `You have been assigned to a ${emergency.type} emergency`,
          {
            emergencyId,
            type: emergency.type,
            severity: emergency.severity
          }
        );
      } catch (notificationError) {
        console.error('Failed to notify responder:', notificationError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Responder assigned successfully',
      data: { emergency }
    });
  } catch (error) {
    console.error('Assign responder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign responder',
      error: error.message
    });
  }
};

// Get nearby emergencies
const getNearbyEmergencies = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const emergencies = await Emergency.findNearbyEmergencies(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    );

    res.status(200).json({
      success: true,
      data: {
        emergencies,
        count: emergencies.length
      }
    });
  } catch (error) {
    console.error('Get nearby emergencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby emergencies',
      error: error.message
    });
  }
};

// Get emergency statistics (Admin only)
const getEmergencyStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await Emergency.getStatistics(startDate, endDate);

    res.status(200).json({
      success: true,
      data: { statistics: stats[0] || {} }
    });
  } catch (error) {
    console.error('Get emergency statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency statistics',
      error: error.message
    });
  }
};

module.exports = {
  createEmergency,
  getUserEmergencies,
  getAllEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  assignResponder,
  getNearbyEmergencies,
  getEmergencyStatistics
};
