const User = require('../models/User');
const { createBlockchainIdentity } = require('../config/blockchain');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/kyc/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed!'));
    }
  }
});

// Submit KYC information
const submitKYC = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      fullName,
      dateOfBirth,
      gender,
      address,
      governmentIdType,
      governmentIdNumber,
      consentGiven
    } = req.body;

    // Validate required fields
    if (!fullName || !dateOfBirth || !gender || !address || !governmentIdType || !governmentIdNumber) {
      return res.status(400).json({
        success: false,
        message: 'All KYC fields are required'
      });
    }

    if (!consentGiven) {
      return res.status(400).json({
        success: false,
        message: 'Consent is required to proceed with KYC'
      });
    }

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if KYC already submitted
    if (user.kyc.status === 'submitted' || user.kyc.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'KYC already submitted or verified'
      });
    }

    // Parse address if it's a string
    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address format'
        });
      }
    }

    // Update user KYC information
    user.kyc = {
      status: 'submitted',
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      address: parsedAddress,
      governmentId: {
        type: governmentIdType,
        number: governmentIdNumber,
        documentUrl: req.files?.document?.[0]?.path || '',
        selfieUrl: req.files?.selfie?.[0]?.path || ''
      },
      submittedAt: new Date()
    };

    // Update blockchain consent
    user.blockchain.consentGiven = consentGiven;
    user.blockchain.consentTimestamp = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'KYC information submitted successfully',
      data: {
        kycStatus: user.kyc.status,
        submittedAt: user.kyc.submittedAt
      }
    });
  } catch (error) {
    console.error('Submit KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC information',
      error: error.message
    });
  }
};

// Get KYC status
const getKYCStatus = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findOne({ userId }).select('kyc blockchain');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        kycStatus: user.kyc.status,
        blockchainId: user.blockchain.blockchainId,
        walletAddress: user.blockchain.walletAddress,
        isBlockchainVerified: user.blockchain.isBlockchainVerified,
        submittedAt: user.kyc.submittedAt,
        verifiedAt: user.kyc.verifiedAt,
        rejectedAt: user.kyc.rejectedAt,
        rejectionReason: user.kyc.rejectionReason
      }
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC status',
      error: error.message
    });
  }
};

// Verify KYC (Admin only)
const verifyKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.kyc.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'KYC must be in submitted status to verify'
      });
    }

    if (action === 'approve') {
      // Create blockchain identity
      const blockchainResult = await createBlockchainIdentity(userId, user.kyc);

      // Update user with verification and blockchain data
      user.kyc.status = 'verified';
      user.kyc.verifiedAt = new Date();
      user.kyc.verifiedBy = req.user.userId;

      user.blockchain.walletAddress = blockchainResult.walletAddress;
      user.blockchain.blockchainId = blockchainResult.blockchainId;
      user.blockchain.privateKeyHash = blockchainResult.privateKeyHash;
      user.blockchain.isBlockchainVerified = true;
      user.blockchain.blockchainCreatedAt = new Date();

      await user.save();

      res.status(200).json({
        success: true,
        message: 'KYC verified and blockchain identity created successfully',
        data: {
          kycStatus: user.kyc.status,
          blockchainId: user.blockchain.blockchainId,
          walletAddress: user.blockchain.walletAddress,
          blockHash: blockchainResult.blockHash,
          blockIndex: blockchainResult.blockIndex
        }
      });
    } else {
      // Reject KYC
      user.kyc.status = 'rejected';
      user.kyc.rejectedAt = new Date();
      user.kyc.rejectionReason = rejectionReason || 'KYC verification failed';
      user.kyc.verifiedBy = req.user.userId;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'KYC rejected',
        data: {
          kycStatus: user.kyc.status,
          rejectionReason: user.kyc.rejectionReason
        }
      });
    }
  } catch (error) {
    console.error('Verify KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify KYC',
      error: error.message
    });
  }
};

// Get all pending KYC submissions (Admin only)
const getPendingKYC = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const users = await User.find({ 'kyc.status': 'submitted' })
      .select('userId name email kyc')
      .sort({ 'kyc.submittedAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({ 'kyc.status': 'submitted' });

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
    console.error('Get pending KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending KYC submissions',
      error: error.message
    });
  }
};

// Get KYC statistics (Admin only)
const getKYCStatistics = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$kyc.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const blockchainUsers = await User.countDocuments({ 'blockchain.isBlockchainVerified': true });

    const formattedStats = {
      total: totalUsers,
      pending: 0,
      submitted: 0,
      verified: 0,
      rejected: 0,
      blockchainVerified: blockchainUsers
    };

    stats.forEach(stat => {
      if (stat._id) {
        formattedStats[stat._id] = stat.count;
      }
    });

    res.status(200).json({
      success: true,
      data: { statistics: formattedStats }
    });
  } catch (error) {
    console.error('Get KYC statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC statistics',
      error: error.message
    });
  }
};

module.exports = {
  submitKYC,
  getKYCStatus,
  verifyKYC,
  getPendingKYC,
  getKYCStatistics,
  upload
};
