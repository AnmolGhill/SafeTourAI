const Transaction = require('../models/Transaction');
const { addTransaction, getTransactionHistory, validateBlockchain, sendWeb3Transaction } = require('../config/blockchain');

// Create blockchain transaction
const createTransaction = async (req, res) => {
  try {
    const { userId } = req.user;
    const { emergencyId, transactionType, details, networkId = 'local' } = req.body;

    if (!emergencyId || !transactionType || !details) {
      return res.status(400).json({
        success: false,
        message: 'Emergency ID, transaction type, and details are required'
      });
    }

    // Validate transaction type
    const validTypes = ['emergency_created', 'emergency_updated', 'responder_assigned', 'emergency_resolved', 'user_action'];
    if (!validTypes.includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type'
      });
    }

    // Prepare transaction data for blockchain
    const transactionData = {
      userId,
      emergencyId,
      transactionType,
      details: {
        ...details,
        timestamp: new Date(),
        initiatedBy: userId
      }
    };

    // Add to blockchain
    const blockResult = await addTransaction(transactionData);

    // Create transaction record in database
    const transaction = new Transaction({
      userId,
      emergencyId,
      transactionType,
      blockchainHash: blockResult.blockHash,
      blockIndex: blockResult.blockIndex,
      details: {
        action: details.action || transactionType,
        description: details.description || `Transaction of type ${transactionType}`,
        metadata: details.metadata || {},
        location: details.location || { type: 'Point', coordinates: [0, 0] },
        timestamp: new Date()
      },
      status: 'confirmed',
      networkId,
      isVerified: true,
      verifiedAt: new Date()
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Blockchain transaction created successfully',
      data: {
        transaction: {
          transactionId: transaction.transactionId,
          blockchainHash: transaction.blockchainHash,
          blockIndex: transaction.blockIndex,
          status: transaction.status,
          createdAt: transaction.createdAt
        },
        blockResult
      }
    });
  } catch (error) {
    console.error('Create blockchain transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blockchain transaction',
      error: error.message
    });
  }
};

// Get user transactions
const getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type, status } = req.query;

    // Check authorization
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access these transactions'
      });
    }

    const filter = { userId };
    if (type) filter.transactionType = type;
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('emergency', 'emergencyId type status location');

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTransactions: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user transactions',
      error: error.message
    });
  }
};

// Get all transactions (Admin only)
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, userId } = req.query;

    const filter = {};
    if (type) filter.transactionType = type;
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email userId')
      .populate('emergency', 'emergencyId type status location');

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTransactions: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
};

// Get transaction by blockchain hash
const getTransactionByHash = async (req, res) => {
  try {
    const { hash } = req.params;

    const transaction = await Transaction.findByBlockchainHash(hash);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check authorization
    if (req.user.userId !== transaction.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this transaction'
      });
    }

    res.status(200).json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Get transaction by hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction',
      error: error.message
    });
  }
};

// Get emergency transactions
const getEmergencyTransactions = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const transactions = await Transaction.getEmergencyTransactions(emergencyId);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        count: transactions.length
      }
    });
  } catch (error) {
    console.error('Get emergency transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency transactions',
      error: error.message
    });
  }
};

// Get blockchain history
const getBlockchainHistory = async (req, res) => {
  try {
    const history = await getTransactionHistory();

    res.status(200).json({
      success: true,
      data: {
        blockchain: history,
        totalBlocks: history.length
      }
    });
  } catch (error) {
    console.error('Get blockchain history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain history',
      error: error.message
    });
  }
};

// Validate blockchain integrity
const validateBlockchainIntegrity = async (req, res) => {
  try {
    const isValid = await validateBlockchain();

    res.status(200).json({
      success: true,
      data: {
        isValid,
        message: isValid ? 'Blockchain is valid' : 'Blockchain integrity compromised'
      }
    });
  } catch (error) {
    console.error('Validate blockchain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate blockchain',
      error: error.message
    });
  }
};

// Get transaction statistics (Admin only)
const getTransactionStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await Transaction.getStatistics(startDate, endDate);

    res.status(200).json({
      success: true,
      data: { statistics: stats[0] || {} }
    });
  } catch (error) {
    console.error('Get transaction statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction statistics',
      error: error.message
    });
  }
};

// Verify transaction
const verifyTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { method = 'manual', signature } = req.body;

    const transaction = await Transaction.findOne({ transactionId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Perform integrity check
    const integrity = transaction.verifyIntegrity();
    if (!integrity.isValid) {
      return res.status(400).json({
        success: false,
        message: `Transaction verification failed: ${integrity.error}`
      });
    }

    // Add verification details
    await transaction.addVerification(method, req.user.userId, signature || '');

    res.status(200).json({
      success: true,
      message: 'Transaction verified successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Verify transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify transaction',
      error: error.message
    });
  }
};

// Send Web3 transaction (for external blockchain)
const sendExternalTransaction = async (req, res) => {
  try {
    const { transactionData, toAddress, value = 0 } = req.body;

    if (!transactionData) {
      return res.status(400).json({
        success: false,
        message: 'Transaction data is required'
      });
    }

    const result = await sendWeb3Transaction({
      ...transactionData,
      toAddress,
      value,
      from: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: 'External blockchain transaction sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Send external transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send external transaction',
      error: error.message
    });
  }
};

module.exports = {
  createTransaction,
  getUserTransactions,
  getAllTransactions,
  getTransactionByHash,
  getEmergencyTransactions,
  getBlockchainHistory,
  validateBlockchainIntegrity,
  getTransactionStatistics,
  verifyTransaction,
  sendExternalTransaction
};
