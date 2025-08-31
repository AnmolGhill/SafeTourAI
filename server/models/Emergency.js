const mongoose = require('mongoose');
const { generateEmergencyId } = require('../utils/generateId');

const emergencySchema = new mongoose.Schema({
  emergencyId: {
    type: String,
    unique: true,
    default: generateEmergencyId
  },
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required']
    },
    address: {
      type: String,
      default: ''
    }
  },
  type: {
    type: String,
    enum: ['medical', 'accident', 'crime', 'fire', 'natural_disaster', 'other'],
    required: [true, 'Emergency type is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'responded', 'resolved', 'cancelled'],
    default: 'active'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  familyContacts: [{
    name: String,
    phone: String,
    email: String,
    notified: {
      type: Boolean,
      default: false
    },
    notifiedAt: Date
  }],
  responders: [{
    userId: {
      type: String,
      ref: 'User'
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['assigned', 'en_route', 'arrived', 'completed'],
      default: 'assigned'
    },
    estimatedArrival: Date
  }],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: String,
      ref: 'User'
    },
    details: String
  }],
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: Date,
  resolvedBy: {
    type: String,
    ref: 'User'
  },
  resolution: {
    type: String,
    maxlength: [200, 'Resolution cannot exceed 200 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
emergencySchema.index({ location: '2dsphere' });

// Index for faster queries
emergencySchema.index({ status: 1 });
emergencySchema.index({ type: 1 });
emergencySchema.index({ severity: 1 });
emergencySchema.index({ createdAt: -1 });

// Virtual for user details
emergencySchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for responder details
emergencySchema.virtual('responderDetails', {
  ref: 'User',
  localField: 'responders.userId',
  foreignField: 'userId'
});

// Add timeline entry method
emergencySchema.methods.addTimelineEntry = function(action, performedBy, details = '') {
  this.timeline.push({
    action,
    timestamp: new Date(),
    performedBy,
    details
  });
  return this.save();
};

// Update status method
emergencySchema.methods.updateStatus = function(newStatus, performedBy, details = '') {
  this.status = newStatus;
  
  if (newStatus === 'resolved') {
    this.isResolved = true;
    this.resolvedAt = new Date();
    this.resolvedBy = performedBy;
  }
  
  this.addTimelineEntry(`Status changed to ${newStatus}`, performedBy, details);
  return this.save();
};

// Assign responder method
emergencySchema.methods.assignResponder = function(responderId, estimatedArrival = null) {
  const existingResponder = this.responders.find(r => r.userId === responderId);
  
  if (!existingResponder) {
    this.responders.push({
      userId: responderId,
      respondedAt: new Date(),
      status: 'assigned',
      estimatedArrival
    });
    
    this.addTimelineEntry('Responder assigned', responderId);
  }
  
  return this.save();
};

// Update responder status method
emergencySchema.methods.updateResponderStatus = function(responderId, status, performedBy) {
  const responder = this.responders.find(r => r.userId === responderId);
  
  if (responder) {
    responder.status = status;
    this.addTimelineEntry(`Responder status: ${status}`, performedBy);
  }
  
  return this.save();
};

// Mark family contact as notified
emergencySchema.methods.markContactNotified = function(contactIndex) {
  if (this.familyContacts[contactIndex]) {
    this.familyContacts[contactIndex].notified = true;
    this.familyContacts[contactIndex].notifiedAt = new Date();
  }
  return this.save();
};

// Add media method
emergencySchema.methods.addMedia = function(mediaType, url) {
  this.media.push({
    type: mediaType,
    url,
    uploadedAt: new Date()
  });
  return this.save();
};

// Find nearby emergencies
emergencySchema.statics.findNearbyEmergencies = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: { $in: ['active', 'responded'] }
  }).populate('user', 'name phone email');
};

// Find active emergencies
emergencySchema.statics.findActiveEmergencies = function() {
  return this.find({
    status: { $in: ['active', 'responded'] }
  }).populate('user', 'name phone email location');
};

// Find emergencies by type
emergencySchema.statics.findByType = function(type, limit = 50) {
  return this.find({ type })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name phone email');
};

// Get emergency statistics
emergencySchema.statics.getStatistics = function(startDate, endDate) {
  const matchStage = {};
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            status: '$status',
            severity: '$severity'
          }
        },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        avgResponseTime: {
          $avg: {
            $subtract: ['$updatedAt', '$createdAt']
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Emergency', emergencySchema);
