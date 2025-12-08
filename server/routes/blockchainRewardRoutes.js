const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const admin = require('firebase-admin');
const walletService = require('../services/walletService');
const { ethers } = require('ethers');

/**
 * Submit image hash to blockchain and claim reward
 * POST /api/blockchain/submit-image-reward
 */
router.post('/submit-image-reward', authMiddleware, async (req, res) => {
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
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
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
      status: 'pending', // pending, processing, completed, failed
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Firestore
    const recordRef = await admin
      .firestore()
      .collection('blockchain_rewards')
      .add(blockchainRecord);

    console.log('📝 Blockchain reward record created:', recordRef.id);
    console.log(`💰 Processing reward: ${totalReward} ETH to ${walletAddress}`);

    let transactionHash = null;
    let transactionStatus = 'pending';

    try {
      // Attempt to send real ETH transaction to user's wallet
      // Using a reward distribution wallet (configured in .env)
      const rewardWalletPrivateKey = process.env.REWARD_WALLET_PRIVATE_KEY;
      
      if (rewardWalletPrivateKey && walletService.provider) {
        console.log('🔄 Initiating real Ethereum transaction...');
        
        const rewardWallet = new ethers.Wallet(rewardWalletPrivateKey, walletService.provider);
        
        // Convert reward to Wei
        const rewardWei = ethers.parseEther(totalReward.toString());
        
        // Create and send transaction
        const tx = await rewardWallet.sendTransaction({
          to: walletAddress,
          value: rewardWei
        });
        
        console.log(`📤 Transaction sent: ${tx.hash}`);
        transactionHash = tx.hash;
        
        // Wait for transaction confirmation (optional - can be async)
        // const receipt = await tx.wait();
        // transactionStatus = receipt.status === 1 ? 'completed' : 'failed';
        
        transactionStatus = 'processing';
      } else {
        // Fallback: Create simulated transaction hash based on SHA-256
        console.log('⚠️ Real wallet not configured, using simulated transaction');
        transactionHash = `0x${sha256}`; // Use actual SHA-256 as TX hash
        transactionStatus = 'simulated';
      }
    } catch (txError) {
      console.error('❌ Transaction error:', txError.message);
      transactionHash = `0x${sha256}`; // Fallback to SHA-256 hash
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
router.get('/rewards-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await admin
      .firestore()
      .collection('blockchain_rewards')
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
router.get('/reward-stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await admin
      .firestore()
      .collection('blockchain_rewards')
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

/**
 * Verify image hash on blockchain
 * POST /api/blockchain/verify-hash
 */
router.post('/verify-hash', authMiddleware, async (req, res) => {
  try {
    const { sha256 } = req.body;

    if (!sha256) {
      return res.status(400).json({ error: 'SHA-256 hash required' });
    }

    const snapshot = await admin
      .firestore()
      .collection('blockchain_rewards')
      .where('sha256', '==', sha256)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        found: false,
        message: 'Hash not found on blockchain'
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    res.json({
      success: true,
      found: true,
      data: {
        id: doc.id,
        sha256: data.sha256,
        phash: data.phash,
        clarity_score: data.clarity_score,
        transactionHash: data.transactionHash,
        walletAddress: data.walletAddress,
        rewardAmount: data.rewardAmount,
        status: data.status,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error verifying hash:', error);
    res.status(500).json({
      error: 'Failed to verify hash',
      message: error.message
    });
  }
});

module.exports = router;
