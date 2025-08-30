const User = require('../models/User');
const Emergency = require('../models/Emergency');
const Transaction = require('../models/Transaction');

// Get user profile by userId
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId })
      .populate('emergencies', 'emergencyId type status createdAt')
      .populate('transactions', 'transactionId type status createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, emergencyContacts, preferences, profileImage } = req.body;

    // Check if user exists and is authorized
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this profile'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (emergencyContacts) updateData.emergencyContacts = emergencyContacts;
    if (preferences) updateData.preferences = preferences;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Update user location
const updateLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { longitude, latitude, address } = req.body;

    // Check if user exists and is authorized
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this location'
      });
    }

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.updateLocation(longitude, latitude, address);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: user.location
      }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

// Get nearby users
const getNearbyUsers = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const nearbyUsers = await User.findNearbyUsers(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    );

    res.status(200).json({
      success: true,
      data: {
        users: nearbyUsers,
        count: nearbyUsers.length
      }
    });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby users',
      error: error.message
    });
  }
};

// Get nearby responders
const getNearbyResponders = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const responders = await User.findResponders(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    );

    res.status(200).json({
      success: true,
      data: {
        responders,
        count: responders.length
      }
    });
  } catch (error) {
    console.error('Get nearby responders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby responders',
      error: error.message
    });
  }
};

// Add emergency contact
const addEmergencyContact = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, email, relationship } = req.body;

    // Check if user exists and is authorized
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to add emergency contact'
      });
    }

    if (!name || !phone || !email || !relationship) {
      return res.status(400).json({
        success: false,
        message: 'All contact fields are required'
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.addEmergencyContact({ name, phone, email, relationship });

    res.status(200).json({
      success: true,
      message: 'Emergency contact added successfully',
      data: {
        emergencyContacts: user.emergencyContacts
      }
    });
  } catch (error) {
    console.error('Add emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact',
      error: error.message
    });
  }
};

// Remove emergency contact
const removeEmergencyContact = async (req, res) => {
  try {
    const { userId, contactId } = req.params;

    // Check if user exists and is authorized
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to remove emergency contact'
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.removeEmergencyContact(contactId);

    res.status(200).json({
      success: true,
      message: 'Emergency contact removed successfully',
      data: {
        emergencyContacts: user.emergencyContacts
      }
    });
  } catch (error) {
    console.error('Remove emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove emergency contact',
      error: error.message
    });
  }
};

// Get user dashboard data
const getDashboard = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists and is authorized
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this dashboard'
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's recent emergencies
    const recentEmergencies = await Emergency.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get user's recent transactions
    const recentTransactions = await Transaction.getUserTransactions(userId, 5);

    // Get active emergencies count
    const activeEmergencies = await Emergency.countDocuments({
      userId,
      status: { $in: ['active', 'responded'] }
    });

    // Get total transactions count
    const totalTransactions = await Transaction.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
          emergencyContacts: user.emergencyContacts,
          preferences: user.preferences
        },
        stats: {
          activeEmergencies,
          totalTransactions,
          totalEmergencies: recentEmergencies.length
        },
        recentEmergencies,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

// Update user role (Admin only)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'user', 'responder'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { role },
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
      message: 'User role updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

module.exports = {
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
};
