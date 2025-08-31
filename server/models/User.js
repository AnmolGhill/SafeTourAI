const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generateUserId } = require('../utils/generateId');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    default: generateUserId
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[0-9\s\-()]+$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'responder'],
    default: 'user'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: {
      type: String,
      default: ''
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    }
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  firebaseToken: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  // KYC and Blockchain Identity fields
  kyc: {
    status: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected'],
      default: 'pending'
    },
    fullName: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    governmentId: {
      type: {
        type: String,
        enum: ['aadhaar', 'passport', 'driving_license']
      },
      number: {
        type: String,
        select: false // Hide from queries for security
      },
      documentUrl: String,
      selfieUrl: String
    },
    submittedAt: Date,
    verifiedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    verifiedBy: {
      type: String,
      ref: 'User'
    }
  },
  blockchain: {
    walletAddress: {
      type: String,
      unique: true,
      sparse: true
    },
    blockchainId: {
      type: String,
      unique: true,
      sparse: true
    },
    privateKeyHash: {
      type: String,
      select: false // Never expose private key
    },
    isBlockchainVerified: {
      type: Boolean,
      default: false
    },
    blockchainCreatedAt: Date,
    consentGiven: {
      type: Boolean,
      default: false
    },
    consentTimestamp: Date
  },
  // Digital ID fields
  digitalId: {
    id: {
      type: String,
      unique: true,
      sparse: true
    },
    blockchainHash: String,
    createdAt: Date,
    network: String,
    contractAddress: String,
    tokenId: Number,
    verificationLevel: String,
    expiryDate: Date,
    userData: {
      fullName: String,
      email: String,
      nationality: String,
      dateOfBirth: Date,
      kycVerified: Boolean
    },
    securityFeatures: {
      immutable: Boolean,
      cryptographicallySecure: Boolean,
      globallyRecognized: Boolean,
      emergencyAccess: Boolean
    }
  },
  digitalIdHistory: [{
    action: String,
    timestamp: Date,
    reason: String
  }],
  kycVerified: {
    type: Boolean,
    default: false
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      shareLocation: {
        type: Boolean,
        default: true
      },
      allowEmergencyAccess: {
        type: Boolean,
        default: true
      }
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Index for faster queries
userSchema.index({ role: 1 });

// Virtual for user's emergencies
userSchema.virtual('emergencies', {
  ref: 'Emergency',
  localField: 'userId',
  foreignField: 'userId'
});

// Virtual for user's transactions
userSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: 'userId',
  foreignField: 'userId'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Update location method
userSchema.methods.updateLocation = function(longitude, latitude, address = '') {
  this.location.coordinates = [longitude, latitude];
  this.location.address = address;
  this.location.lastUpdated = new Date();
  return this.save();
};

// Add emergency contact method
userSchema.methods.addEmergencyContact = function(contact) {
  this.emergencyContacts.push(contact);
  return this.save();
};

// Remove emergency contact method
userSchema.methods.removeEmergencyContact = function(contactId) {
  this.emergencyContacts.id(contactId).remove();
  return this.save();
};

// Get nearby users method (for responders)
userSchema.statics.findNearbyUsers = function(longitude, latitude, maxDistance = 5000) {
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
    isActive: true
  });
};

// Find responders method
userSchema.statics.findResponders = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    role: 'responder',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  });
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
