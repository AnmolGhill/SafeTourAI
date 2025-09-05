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
    // First, ensure the user has a digital ID by checking and loading it if needed
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
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

module.exports = router;
