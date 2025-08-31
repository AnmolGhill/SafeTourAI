const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    minlength: [4, 'OTP must be at least 4 characters'],
    maxlength: [8, 'OTP cannot exceed 8 characters']
  },
  purpose: {
    type: String,
    enum: ['email_verification', 'password_reset', 'phone_verification', 'login_verification'],
    default: 'email_verification'
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry time is required'],
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  attempts: {
    type: Number,
    default: 0,
    max: [5, 'Maximum 5 attempts allowed']
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: Date,
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
otpSchema.index({ otp: 1 });
otpSchema.index({ purpose: 1 });

// TTL index to automatically delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Check if OTP is valid
otpSchema.methods.isValid = function() {
  return !this.isUsed && !this.isBlocked && new Date() < this.expiresAt;
};

// Mark OTP as used
otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

// Increment attempt count
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  
  // Block OTP after 5 failed attempts
  if (this.attempts >= 5) {
    this.isBlocked = true;
    this.blockedAt = new Date();
  }
  
  return this.save();
};

// Verify OTP
otpSchema.methods.verify = function(inputOtp) {
  // Check if OTP is blocked
  if (this.isBlocked) {
    return {
      success: false,
      message: 'OTP is blocked due to too many failed attempts'
    };
  }
  
  // Check if OTP is already used
  if (this.isUsed) {
    return {
      success: false,
      message: 'OTP has already been used'
    };
  }
  
  // Check if OTP is expired
  if (new Date() > this.expiresAt) {
    return {
      success: false,
      message: 'OTP has expired'
    };
  }
  
  // Check if OTP matches
  if (this.otp !== inputOtp) {
    this.incrementAttempts();
    return {
      success: false,
      message: 'Invalid OTP',
      attemptsLeft: Math.max(0, 5 - this.attempts)
    };
  }
  
  // OTP is valid
  this.markAsUsed();
  return {
    success: true,
    message: 'OTP verified successfully'
  };
};

// Find valid OTP for email and purpose
otpSchema.statics.findValidOtp = function(email, purpose = 'email_verification') {
  return this.findOne({
    email,
    purpose,
    isUsed: false,
    isBlocked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Create new OTP (invalidate previous ones)
otpSchema.statics.createOtp = async function(email, otp, purpose = 'email_verification', expiryMinutes = 10, metadata = {}) {
  // Invalidate any existing valid OTPs for this email and purpose
  await this.updateMany(
    {
      email,
      purpose,
      isUsed: false,
      isBlocked: false
    },
    {
      isUsed: true,
      usedAt: new Date()
    }
  );
  
  // Create new OTP
  const newOtp = new this({
    email,
    otp,
    purpose,
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    ipAddress: metadata.ipAddress || '',
    userAgent: metadata.userAgent || ''
  });
  
  return newOtp.save();
};

// Cleanup expired OTPs (manual cleanup if needed)
otpSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Get OTP statistics
otpSchema.statics.getStatistics = function(startDate, endDate) {
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
        used: {
          $sum: { $cond: [{ $eq: ['$isUsed', true] }, 1, 0] }
        },
        blocked: {
          $sum: { $cond: [{ $eq: ['$isBlocked', true] }, 1, 0] }
        },
        expired: {
          $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] }
        },
        byPurpose: {
          $push: {
            purpose: '$purpose',
            isUsed: '$isUsed',
            isBlocked: '$isBlocked'
          }
        },
        avgAttempts: { $avg: '$attempts' }
      }
    }
  ]);
};

// Check rate limiting for email
otpSchema.statics.checkRateLimit = async function(email, purpose = 'email_verification', timeWindowMinutes = 60, maxOtps = 5) {
  const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  const count = await this.countDocuments({
    email,
    purpose,
    createdAt: { $gte: timeWindow }
  });
  
  return {
    isAllowed: count < maxOtps,
    count,
    maxAllowed: maxOtps,
    timeWindowMinutes
  };
};

module.exports = mongoose.model('Otp', otpSchema);
