const mongoose = require('mongoose');
const { generateTransactionId } = require('../utils/generateId');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    default: generateTransactionId
  },
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  emergencyId: {
    type: String,
    ref: 'Emergency',
    required: [true, 'Emergency ID is required']
  },
  blockchainHash: {
    type: String,
    required: [true, 'Blockchain hash is required'],
    unique: true
  },
  blockIndex: {
    type: Number,
    required: [true, 'Block index is required']
  },
  transactionType: {
    type: String,
    enum: ['emergency_created', 'emergency_updated', 'responder_assigned', 'emergency_resolved', 'user_action'],
    required: [true, 'Transaction type is required']
  },
  details: {
    action: {
      type: String,
      required: [true, 'Action is required']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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
      }
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  gasUsed: {
    type: Number,
    default: 0
  },
  gasPrice: {
    type: Number,
    default: 0
  },
  networkFee: {
    type: Number,
    default: 0
  },
  confirmations: {
    type: Number,
    default: 0
  },
  networkId: {
    type: String,
    default: 'local'
  },
  fromAddress: {
    type: String,
    default: ''
  },
  toAddress: {
    type: String,
    default: ''
  },
  signature: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verificationDetails: {
    method: String,
    verifiedBy: String,
    signature: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ emergencyId: 1 });
transactionSchema.index({ blockchainHash: 1 });
transactionSchema.index({ transactionType: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'details.timestamp': -1 });

// Virtual for user details
transactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Virtual for emergency details
transactionSchema.virtual('emergency', {
  ref: 'Emergency',
  localField: 'emergencyId',
  foreignField: 'emergencyId',
  justOne: true
});

// Update status method
transactionSchema.methods.updateStatus = function(newStatus, confirmations = 0) {
  this.status = newStatus;
  this.confirmations = confirmations;
  
  if (newStatus === 'confirmed') {
    this.isVerified = true;
    this.verifiedAt = new Date();
  }
  
  return this.save();
};

// Add verification details
transactionSchema.methods.addVerification = function(method, verifiedBy, signature) {
  this.verificationDetails = {
    method,
    verifiedBy,
    signature
  };
  this.isVerified = true;
  this.verifiedAt = new Date();
  return this.save();
};

// Get transaction by blockchain hash
transactionSchema.statics.findByBlockchainHash = function(hash) {
  return this.findOne({ blockchainHash: hash })
    .populate('user', 'name email userId')
    .populate('emergency', 'emergencyId type status');
};

// Get user transactions
transactionSchema.statics.getUserTransactions = function(userId, limit = 50, offset = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('emergency', 'emergencyId type status location');
};

// Get emergency transactions
transactionSchema.statics.getEmergencyTransactions = function(emergencyId) {
  return this.find({ emergencyId })
    .sort({ createdAt: 1 })
    .populate('user', 'name userId');
};

// Get transactions by type
transactionSchema.statics.getByType = function(transactionType, limit = 100) {
  return this.find({ transactionType })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name userId')
    .populate('emergency', 'emergencyId type status');
};

// Get pending transactions
transactionSchema.statics.getPendingTransactions = function() {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 });
};

// Get transaction statistics
transactionSchema.statics.getStatistics = function(startDate, endDate) {
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
        confirmed: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        byType: {
          $push: {
            type: '$transactionType',
            status: '$status'
          }
        },
        avgGasUsed: { $avg: '$gasUsed' },
        totalNetworkFees: { $sum: '$networkFee' }
      }
    }
  ]);
};

// Verify transaction integrity
transactionSchema.methods.verifyIntegrity = function() {
  // Basic integrity checks
  const requiredFields = ['userId', 'emergencyId', 'blockchainHash', 'transactionType'];
  
  for (const field of requiredFields) {
    if (!this[field]) {
      return {
        isValid: false,
        error: `Missing required field: ${field}`
      };
    }
  }
  
  // Check if blockchain hash format is valid (basic check)
  if (!/^[a-fA-F0-9]{64}$/.test(this.blockchainHash)) {
    return {
      isValid: false,
      error: 'Invalid blockchain hash format'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

// Create transaction record
transactionSchema.statics.createTransaction = function(data) {
  const transaction = new this(data);
  const integrity = transaction.verifyIntegrity();
  
  if (!integrity.isValid) {
    throw new Error(`Transaction integrity check failed: ${integrity.error}`);
  }
  
  return transaction.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);
