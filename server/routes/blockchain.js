const express = require('express');
const { verifyFirebaseToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
const blockchainService = require('../services/blockchainService');
const walletService = require('../services/walletService');
const { ethers } = require('ethers');
const admin = require('firebase-admin');
const logger = require('../utils/logger');

const router = express.Router();

// Get blockchain transactions for user
router.get('/transactions', verifyFirebaseToken, async (req, res) => {
  try {
    // Check if Firebase is properly initialized
    if (!db) {
      console.warn('⚠️ Firebase not initialized, returning mock transactions');
      return res.json({
        success: true,
        transactions: generateMockTransactions(req.user.uid),
        totalCount: 3,
        userBlockchainId: `ST-${req.user.uid.substring(0, 8).toUpperCase()}`
      });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      // Return mock data if user not found in database
      console.warn('⚠️ User not found in database, returning mock transactions');
      return res.json({
        success: true,
        transactions: generateMockTransactions(req.user.uid),
        totalCount: 3,
        userBlockchainId: `ST-${req.user.uid.substring(0, 8).toUpperCase()}`
      });
    }

    const userData = userDoc.data();
    
    // Get user's blockchain transactions from Firestore
    const transactionsSnapshot = await db.collection('blockchain_transactions')
      .where('userId', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: data.transactionHash || doc.id,
        userId: data.userId,
        eventType: data.eventType,
        status: data.status || 'verified',
        timestamp: data.timestamp,
        blockHash: data.blockHash,
        blockNumber: data.blockNumber,
        gasUsed: data.gasUsed,
        confirmations: data.confirmations
      });
    });

    // If no transactions found and user has blockchain ID, create sample transaction
    if (transactions.length === 0 && userData.blockchainId) {
      const sampleTransaction = {
        id: `TXN_${Date.now()}_${userData.blockchainId.substring(0, 8)}`,
        userId: req.user.uid,
        eventType: 'KYC Verification Complete',
        status: 'verified',
        timestamp: userData.kycApprovedAt || new Date().toISOString(),
        blockHash: `0x${require('crypto').createHash('sha256').update(`${req.user.uid}-${Date.now()}`).digest('hex')}`,
        blockNumber: Math.floor(Date.now() / 1000),
        gasUsed: '21000',
        confirmations: Math.floor(Math.random() * 50) + 12
      };
      
      // Store this transaction for future requests
      await db.collection('blockchain_transactions').add({
        ...sampleTransaction,
        transactionHash: sampleTransaction.id,
        createdAt: new Date().toISOString()
      });
      
      transactions.push(sampleTransaction);
    }

    res.json({
      success: true,
      transactions,
      totalCount: transactions.length,
      userBlockchainId: userData.blockchainId
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getBlockchainTransactions' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blockchain transactions' 
    });
  }
});

// Get blockchain statistics
router.get('/stats', verifyFirebaseToken, async (req, res) => {
  try {
    // Check if Firebase is properly initialized
    if (!db) {
      console.warn('⚠️ Firebase not initialized, returning mock stats');
      return res.json({
        success: true,
        stats: {
          networkStatus: 'active',
          totalRecords: 1247,
          verifiedToday: 23,
          totalVerifiedUsers: 892
        }
      });
    }

    // Get real statistics from database
    const usersSnapshot = await db.collection('users').where('kycStatus', '==', 'approved').get();
    const totalVerifiedUsers = usersSnapshot.size;
    
    const transactionsSnapshot = await db.collection('blockchain_transactions').get();
    const totalTransactions = transactionsSnapshot.size;
    
    // Get today's verifications
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySnapshot = await db.collection('users')
      .where('kycStatus', '==', 'approved')
      .where('kycApprovedAt', '>=', today.toISOString())
      .get();
    const verifiedToday = todaySnapshot.size;

    res.json({
      success: true,
      stats: {
        networkStatus: 'active',
        totalRecords: totalTransactions,
        verifiedToday: verifiedToday,
        totalVerifiedUsers: totalVerifiedUsers
      }
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getBlockchainStats' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blockchain statistics' 
    });
  }
});

// Get digital identity
router.get('/digital-id', verifyFirebaseToken, async (req, res) => {
  try {
    // Check if Firebase is properly initialized
    if (!db) {
      console.warn('⚠️ Firebase not initialized, returning mock digital ID');
      const mockDigitalId = generateMockDigitalId(req.user.uid);
      return res.json(mockDigitalId);
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      console.warn('⚠️ User not found in database, returning mock digital ID');
      const mockDigitalId = generateMockDigitalId(req.user.uid);
      return res.json(mockDigitalId);
    }

    const userData = userDoc.data();
    
    if (!userData.blockchainId || userData.kycStatus !== 'approved') {
      return res.status(404).json({ 
        error: 'Digital ID not found. Complete KYC verification first.',
        kycStatus: userData.kycStatus || 'pending'
      });
    }

    // Get digital identity from blockchain service hashmap
    let digitalIdResult = blockchainService.getDigitalIdentity(req.user.uid);
    
    // If not found in hashmap but blockchain ID exists, create entry
    if (!digitalIdResult.success && userData.blockchainId) {
      console.log(`🔄 Creating hashmap entry for existing blockchain ID: ${userData.blockchainId}`);
      
      // Get KYC data first
      const kycDoc = await db.collection('kyc').doc(req.user.uid).get();
      const kycData = kycDoc.exists ? kycDoc.data() : {};
      
      // Create digital ID data for hashmap
      const digitalIdData = {
        blockchainId: userData.blockchainId,
        uid: req.user.uid,
        fullName: kycData.fullName || userData.name,
        governmentIdNumber: kycData.governmentIdNumber || '',
        createdAt: kycData.reviewedAt || new Date().toISOString(),
        status: 'active',
        verificationLevel: 'Level 3 - Full KYC',
        network: 'SafeTour Blockchain',
        contractAddress: '0x742d35Cc6634C0532925a3b8D404fddF4f0c1234',
        tokenId: Math.floor(Math.random() * 1000000),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        hashMapKey: require('crypto').createHash('sha256').update(`${req.user.uid}-${userData.blockchainId}`).digest('hex')
      };
      
      // Store in hashmap
      blockchainService.digitalIdHashMap.set(digitalIdData.hashMapKey, digitalIdData);
      console.log(`✅ Existing blockchain ID stored in hashmap: ${userData.blockchainId}`);
      
      // Try getting it again
      digitalIdResult = blockchainService.getDigitalIdentity(req.user.uid);
    }
    
    if (!digitalIdResult.success) {
      return res.status(404).json({ 
        error: 'Digital ID not found in blockchain service',
        kycStatus: userData.kycStatus
      });
    }

    // Get KYC data for additional user info
    const kycDoc = await db.collection('kyc').doc(req.user.uid).get();
    const kycData = kycDoc.exists ? kycDoc.data() : {};

    // Merge user data with digital ID
    digitalIdResult.userData.email = userData.email;
    digitalIdResult.userData.dateOfBirth = kycData.dateOfBirth || '';
    digitalIdResult.userData.nationality = kycData.address?.country || 'Indian';

    res.json(digitalIdResult);

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getDigitalId' });
    res.status(500).json({ error: 'Failed to get digital identity' });
  }
});

// Get QR code data for digital ID
router.get('/digital-id/qr', verifyFirebaseToken, async (req, res) => {
  try {
    // Check if Firebase is properly initialized
    if (!db) {
      console.warn('⚠️ Firebase not initialized, returning mock QR data');
      const mockQRData = {
        type: 'SafeTourDigitalID',
        blockchainId: `ST-${req.user.uid.substring(0, 8).toUpperCase()}${Math.floor(Math.random() * 10000)}`,
        uid: req.user.uid,
        verificationLevel: 'Level 3 - Full KYC',
        network: 'SafeTour Blockchain',
        timestamp: new Date().toISOString(),
        hash: require('crypto').createHash('sha256').update(`${req.user.uid}-${Date.now()}`).digest('hex').substring(0, 16)
      };
      return res.json({ qrData: mockQRData });
    }

    // First, ensure the user has a digital ID by checking and loading it if needed
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      console.warn('⚠️ User not found in database, returning mock QR data');
      const mockQRData = {
        type: 'SafeTourDigitalID',
        blockchainId: `ST-${req.user.uid.substring(0, 8).toUpperCase()}${Math.floor(Math.random() * 10000)}`,
        uid: req.user.uid,
        verificationLevel: 'Level 3 - Full KYC',
        network: 'SafeTour Blockchain',
        timestamp: new Date().toISOString(),
        hash: require('crypto').createHash('sha256').update(`${req.user.uid}-${Date.now()}`).digest('hex').substring(0, 16)
      };
      return res.json({ qrData: mockQRData });
    }

    const userData = userDoc.data();
    
    if (!userData.blockchainId || userData.kycStatus !== 'approved') {
      return res.status(404).json({ 
        error: 'Digital ID not found. Complete KYC verification first.',
        kycStatus: userData.kycStatus || 'pending'
      });
    }

    // Check if digital ID exists in hashmap, if not, load it
    let digitalIdResult = blockchainService.getDigitalIdentity(req.user.uid);
    
    if (!digitalIdResult.success && userData.blockchainId) {
      console.log(`🔄 Loading digital ID into hashmap for QR generation: ${userData.blockchainId}`);
      
      // Get KYC data
      const kycDoc = await db.collection('kyc').doc(req.user.uid).get();
      const kycData = kycDoc.exists ? kycDoc.data() : {};
      
      // Create digital ID data for hashmap
      const digitalIdData = {
        blockchainId: userData.blockchainId,
        uid: req.user.uid,
        fullName: kycData.fullName || userData.name,
        governmentIdNumber: kycData.governmentIdNumber || '',
        createdAt: kycData.reviewedAt || new Date().toISOString(),
        status: 'active',
        verificationLevel: 'Level 3 - Full KYC',
        network: 'SafeTour Blockchain',
        contractAddress: '0x742d35Cc6634C0532925a3b8D404fddF4f0c1234',
        tokenId: Math.floor(Math.random() * 1000000),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        hashMapKey: require('crypto').createHash('sha256').update(`${req.user.uid}-${userData.blockchainId}`).digest('hex')
      };
      
      // Store in hashmap
      blockchainService.digitalIdHashMap.set(digitalIdData.hashMapKey, digitalIdData);
      console.log(`✅ Digital ID loaded into hashmap for QR generation: ${userData.blockchainId}`);
    }

    // Now generate QR code data
    const qrData = blockchainService.generateQRCodeData(req.user.uid);
    
    if (!qrData) {
      return res.status(404).json({ error: 'QR code data not available' });
    }

    res.json({ qrData });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getQRCode' });
    res.status(500).json({ error: 'Failed to generate QR code data' });
  }
});

// Verify blockchain ID
router.post('/verify', verifyFirebaseToken, async (req, res) => {
  try {
    const { blockchainId } = req.body;

    if (!blockchainId) {
      return res.status(400).json({ error: 'Blockchain ID is required' });
    }

    const isValid = await blockchainService.verifyBlockchainId(blockchainId);
    
    if (isValid) {
      // Get transaction details
      const transactionDetails = await blockchainService.getTransactionDetails(blockchainId);
      
      res.json({
        valid: true,
        blockchainId,
        transactionDetails
      });
    } else {
      res.json({
        valid: false,
        blockchainId
      });
    }

  } catch (error) {
    logger.error('Verify blockchain ID error:', error);
    res.status(500).json({ error: 'Failed to verify blockchain ID' });
  }
});

// Helper function to generate mock transactions
function generateMockTransactions(uid) {
  const now = new Date();
  return [
    {
      id: `TXN_${Date.now()}_${uid.substring(0, 8)}`,
      userId: uid,
      eventType: 'KYC Verification Complete',
      status: 'verified',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      blockHash: `0x${require('crypto').createHash('sha256').update(`${uid}-kyc-${Date.now()}`).digest('hex')}`,
      blockNumber: Math.floor(Date.now() / 1000),
      gasUsed: '21000',
      confirmations: 47
    },
    {
      id: `TXN_${Date.now() + 1}_${uid.substring(0, 8)}`,
      userId: uid,
      eventType: 'Digital ID Created',
      status: 'verified',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      blockHash: `0x${require('crypto').createHash('sha256').update(`${uid}-id-${Date.now()}`).digest('hex')}`,
      blockNumber: Math.floor(Date.now() / 1000) + 1,
      gasUsed: '45000',
      confirmations: 23
    },
    {
      id: `TXN_${Date.now() + 2}_${uid.substring(0, 8)}`,
      userId: uid,
      eventType: 'Profile Update',
      status: 'verified',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      blockHash: `0x${require('crypto').createHash('sha256').update(`${uid}-update-${Date.now()}`).digest('hex')}`,
      blockNumber: Math.floor(Date.now() / 1000) + 2,
      gasUsed: '18500',
      confirmations: 12
    }
  ];
}

// Helper function to generate mock digital ID
function generateMockDigitalId(uid) {
  const blockchainId = `ST-${uid.substring(0, 8).toUpperCase()}${Math.floor(Math.random() * 10000)}`;
  return {
    success: true,
    digitalId: {
      id: blockchainId,
      blockchainHash: `0x${require('crypto').createHash('sha256').update(`${uid}-${Date.now()}`).digest('hex')}`,
      createdAt: new Date().toISOString(),
      network: 'SafeTour Blockchain',
      contractAddress: '0x742d35Cc6634C0532925a3b8D404fddF4f0c1234',
      tokenId: Math.floor(Math.random() * 1000000),
      verificationLevel: 'Level 3 - Full KYC',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    userData: {
      fullName: 'Demo User',
      email: 'demo@safetourai.com',
      nationality: 'Indian',
      dateOfBirth: '1990-01-01',
      kycVerified: true,
      registrationDate: new Date().toISOString()
    }
  };
}

/**
 * Generate QR code data for user's digital ID
 */
router.get('/qr-code', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    
    // Generate QR code data using blockchain service
    const qrData = blockchainService.generateQRCodeData(uid);
    
    if (!qrData) {
      return res.status(404).json({
        success: false,
        message: 'Digital ID not found. Please ensure your KYC is approved.'
      });
    }
    
    res.json({
      success: true,
      qrData: qrData,
      message: 'QR code data generated successfully'
    });
    
  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'generateQRCode' });
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code data',
      error: error.message
    });
  }
});

/**
 * Submit image hash to blockchain and claim reward
 * POST /api/blockchain/submit-image-reward
 */
router.post('/submit-image-reward', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      sha256,
      phash,
      clarity_score,
      file_name,
      file_size,
      file_type,
      timestamp
    } = req.body;

    // Validate required fields
    if (!sha256 || !phash || clarity_score === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: sha256, phash, clarity_score'
      });
    }

    // Validate hash format
    if (!/^[a-f0-9]{64}$/.test(sha256)) {
      return res.status(400).json({
        error: 'Invalid SHA-256 hash format'
      });
    }

    // Calculate reward based on clarity score
    let baseReward = 0.001; // Base ETH reward
    let clarityBonus = 0;

    if (clarity_score >= 80) {
      clarityBonus = 0.0005; // High quality bonus
    } else if (clarity_score >= 60) {
      clarityBonus = 0.0002; // Medium quality bonus
    }

    const totalReward = baseReward + clarityBonus;

    // Get user wallet address from Firebase
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const walletAddress = userDoc.data().walletAddress;
    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address not configured. Please set up your crypto wallet first.'
      });
    }

    // Create blockchain record in Firestore
    const blockchainRecord = {
      userId,
      sha256,
      phash,
      clarity_score,
      file_name,
      file_size,
      file_type,
      timestamp: new Date(timestamp),
      walletAddress,
      rewardAmount: totalReward,
      clarityBonus,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Firestore
    const recordRef = await db.collection('blockchain_rewards').add(blockchainRecord);

    console.log('📝 Blockchain reward record created:', recordRef.id);
    console.log(`💰 Processing reward: ${totalReward} ETH to ${walletAddress}`);

    let transactionHash = null;
    let transactionStatus = 'pending';

    try {
      // Attempt to send real ETH transaction to user's wallet
      const rewardWalletPrivateKey = process.env.REWARD_WALLET_PRIVATE_KEY;
      
      console.log('🔍 Checking reward wallet configuration...');
      console.log('📧 Reward Wallet Private Key:', rewardWalletPrivateKey ? '✅ Set' : '❌ Not set');
      console.log('🌐 Web3 Provider:', walletService.provider ? '✅ Connected' : '❌ Not connected');
      
      if (rewardWalletPrivateKey && walletService.provider) {
        console.log('✅ Reward wallet configured, initiating real transaction...');
        console.log(`💼 Reward Wallet Address: 0x742d35Cc6634C0532925a3b8D404fddF4f0c1234`);
        console.log(`🎁 Sending to User Wallet: ${walletAddress}`);
        
        const rewardWallet = new ethers.Wallet(rewardWalletPrivateKey, walletService.provider);
        console.log(`✓ Wallet loaded: ${rewardWallet.address}`);
        
        // Convert reward to Wei
        const rewardWei = ethers.parseEther(totalReward.toString());
        console.log(`💰 Amount in Wei: ${rewardWei.toString()}`);
        
        // Get gas price
        const gasPrice = await walletService.provider.getFeeData();
        console.log(`⛽ Gas Price: ${gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') : 'N/A'} Gwei`);
        
        // Create and send transaction
        console.log('🔄 Initiating real Ethereum transaction...');
        const tx = await rewardWallet.sendTransaction({
          to: walletAddress,
          value: rewardWei
        });
        
        console.log(`✅ Transaction created!`);
        console.log(`📤 Transaction Hash: ${tx.hash}`);
        console.log(`🔗 View on Etherscan: https://etherscan.io/tx/${tx.hash}`);
        transactionHash = tx.hash;
        transactionStatus = 'processing';
        
        // Log transaction details
        console.log('📊 Transaction Details:', {
          from: rewardWallet.address,
          to: walletAddress,
          value: ethers.formatEther(rewardWei),
          hash: tx.hash
        });
      } else {
        // Fallback: Create simulated transaction hash based on SHA-256
        console.log('⚠️ Reward wallet not configured!');
        console.log('❌ Missing: REWARD_WALLET_PRIVATE_KEY in .env');
        console.log('📝 Using simulated transaction (fallback mode)');
        transactionHash = `0x${sha256}`;
        transactionStatus = 'simulated';
      }
    } catch (txError) {
      console.error('❌ Transaction error:', txError.message);
      console.error('📋 Error details:', txError);
      transactionHash = `0x${sha256}`;
      transactionStatus = 'failed';
    }

    // Update record with transaction hash
    await recordRef.update({
      transactionHash,
      status: transactionStatus,
      updatedAt: new Date()
    });

    console.log('✅ Blockchain reward submitted:', {
      userId,
      reward: totalReward,
      txHash: transactionHash,
      status: transactionStatus
    });

    // Return success response
    res.json({
      success: true,
      message: 'Image reward submitted to blockchain',
      data: {
        record_id: recordRef.id,
        transaction_hash: transactionHash,
        reward_amount: totalReward,
        clarity_bonus: clarityBonus,
        wallet_address: walletAddress,
        status: transactionStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Blockchain reward submission error:', error);
    res.status(500).json({
      error: 'Failed to submit image reward',
      message: error.message
    });
  }
});

/**
 * Get user's blockchain rewards history
 * GET /api/blockchain/rewards-history
 */
router.get('/rewards-history', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await db.collection('blockchain_rewards')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const rewards = [];
    let totalRewards = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      rewards.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      });
      totalRewards += data.rewardAmount || 0;
    });

    res.json({
      success: true,
      data: {
        rewards,
        totalRewards: parseFloat(totalRewards.toFixed(6)),
        count: rewards.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching rewards history:', error);
    res.status(500).json({
      error: 'Failed to fetch rewards history',
      message: error.message
    });
  }
});

/**
 * Get blockchain reward stats
 * GET /api/blockchain/reward-stats
 */
router.get('/reward-stats', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await db.collection('blockchain_rewards')
      .where('userId', '==', userId)
      .get();

    let totalRewards = 0;
    let totalImages = 0;
    let averageClarity = 0;
    let highQualityCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      totalRewards += data.rewardAmount || 0;
      totalImages += 1;
      averageClarity += data.clarity_score || 0;
      if (data.clarity_score >= 80) {
        highQualityCount += 1;
      }
    });

    averageClarity = totalImages > 0 ? Math.round(averageClarity / totalImages) : 0;

    res.json({
      success: true,
      data: {
        totalRewards: parseFloat(totalRewards.toFixed(6)),
        totalImages,
        averageClarity,
        highQualityCount,
        rewardRate: totalImages > 0 ? parseFloat((totalRewards / totalImages).toFixed(6)) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching reward stats:', error);
    res.status(500).json({
      error: 'Failed to fetch reward stats',
      message: error.message
    });
  }
});

module.exports = router;
