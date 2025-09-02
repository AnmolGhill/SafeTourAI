const express = require('express');
const { verifyFirebaseToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

const router = express.Router();

// Get digital identity
router.get('/digital-id', verifyFirebaseToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    if (!userData.blockchainId) {
      return res.status(404).json({ error: 'Digital ID not found. Complete KYC verification first.' });
    }

    // Get KYC data for digital identity
    const kycDoc = await db.collection('kyc').doc(req.user.uid).get();
    const kycData = kycDoc.exists ? kycDoc.data() : {};

    const digitalIdentity = {
      blockchainId: userData.blockchainId,
      status: 'active',
      verificationLevel: 'verified',
      createdAt: kycData.reviewedAt || new Date().toISOString(),
      attributes: {
        name: kycData.fullName || userData.name,
        verified: true,
        kycCompleted: true,
        kycStatus: userData.kycStatus
      }
    };

    res.json({ digitalIdentity });

  } catch (error) {
    logger.error('Get digital ID error:', error);
    res.status(500).json({ error: 'Failed to get digital identity' });
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

module.exports = router;
