const express = require('express');
const { verifyFirebaseToken, requireAdmin, requireSubAdmin } = require('../middleware/auth');
const { db } = require('../config/firebase');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Test endpoint to check API connectivity
 */
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Digital ID API is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/digital-id/verify - Verify Digital ID',
      'GET /api/digital-id/lookup/:identifier - Lookup Digital ID',
      'GET /api/digital-id/verification-history - Get verification history'
    ]
  });
});

/**
 * Create test user for QR Scanner testing
 */
router.post('/create-test-user', async (req, res) => {
  try {
    const testUserId = 'test-user-123';
    const testBlockchainId = 'blockchain-test-456';
    
    // Create test user
    await db.collection('users').doc(testUserId).set({
      uid: testUserId,
      email: 'testuser@safetourai.com',
      name: 'Test User',
      fullName: 'Test User SafeTour',
      kycStatus: 'approved',
      blockchainId: testBlockchainId,
      kycApprovedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastLoginLocation: 'Test City, Test Country'
    });
    
    // Create test KYC data
    await db.collection('kyc').doc(testUserId).set({
      uid: testUserId,
      fullName: 'Test User SafeTour',
      dateOfBirth: '1990-01-01',
      gender: 'other',
      governmentIdType: 'passport',
      governmentIdNumber: 'TEST123456',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        country: 'Test Country',
        postalCode: '12345'
      },
      status: 'approved',
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      emergencyContact: '+1-555-TEST-123'
    });
    
    // Create digital ID in blockchain service
    const digitalIdResult = await blockchainService.generateBlockchainId(
      testUserId,
      {
        fullName: 'Test User SafeTour',
        dateOfBirth: '1990-01-01',
        governmentIdType: 'passport'
      },
      'testuser@safetourai.com'
    );
    
    console.log('🔗 Digital ID created:', digitalIdResult);
    
    res.json({
      success: true,
      message: 'Test user created successfully',
      testData: {
        uid: testUserId,
        blockchainId: testBlockchainId,
        qrCodeData: JSON.stringify({
          uid: testUserId,
          blockchainId: testBlockchainId,
          hash: 'test-hash-123'
        })
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test user',
      error: error.message
    });
  }
});

/**
 * Debug endpoint to show data format issues
 */
router.post('/debug-data-format', async (req, res) => {
  try {
    console.log('🧪 DEBUG: Raw request body:', req.body);
    console.log('🧪 DEBUG: Request body type:', typeof req.body);
    console.log('🧪 DEBUG: Request body keys:', Object.keys(req.body));
    
    const { qrData, blockchainId, uid, hash } = req.body;
    
    console.log('🧪 DEBUG: Extracted values:');
    console.log('  - qrData:', qrData, '(type:', typeof qrData, ')');
    console.log('  - blockchainId:', blockchainId, '(type:', typeof blockchainId, ')');
    console.log('  - uid:', uid, '(type:', typeof uid, ')');
    console.log('  - hash:', hash, '(type:', typeof hash, ')');
    
    // Test parsing qrData if it exists
    if (qrData) {
      try {
        const parsedQR = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        console.log('🧪 DEBUG: Parsed QR data:', parsedQR);
        console.log('🧪 DEBUG: Parsed QR keys:', Object.keys(parsedQR));
      } catch (parseError) {
        console.log('🧪 DEBUG: QR parsing failed:', parseError.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Data format debug complete',
      receivedData: {
        qrData,
        blockchainId,
        uid,
        hash,
        dataTypes: {
          qrData: typeof qrData,
          blockchainId: typeof blockchainId,
          uid: typeof uid,
          hash: typeof hash
        }
      },
      expectedFormats: {
        option1: 'Send uid directly: {"uid": "test-user-123"}',
        option2: 'Send blockchainId directly: {"blockchainId": "blockchain-test-456"}',
        option3: 'Send qrData object: {"qrData": {"uid": "test-user-123", "blockchainId": "blockchain-test-456"}}',
        option4: 'Send qrData JSON string: {"qrData": "{\\"uid\\":\\"test-user-123\\",\\"blockchainId\\":\\"blockchain-test-456\\"}"}'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'DEBUG: Data format test failed',
      error: error.message
    });
  }
});

/**
 * Debug endpoint to test verification without auth (for testing only)
 */
router.post('/debug-verify', async (req, res) => {
  try {
    const { qrData, blockchainId, uid } = req.body;
    
    console.log('🧪 DEBUG: Digital ID verification request:', { qrData, blockchainId, uid });
    
    // Mock response for testing
    res.json({
      success: true,
      message: 'DEBUG: Digital ID verification test successful',
      digitalId: {
        id: 'mock-digital-id-123',
        status: 'active',
        verificationLevel: 'high',
        network: 'SafeTour Blockchain'
      },
      userData: {
        fullName: 'Test User',
        nationality: 'Test Country',
        kycStatus: 'approved',
        email: 'test@example.com',
        verificationLevel: 'high'
      },
      verificationTimestamp: new Date().toISOString(),
      debug: true
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'DEBUG: Verification test failed',
      error: error.message
    });
  }
});

/**
 * Verify Digital ID by QR code data or blockchain ID
 * Accessible by admin and sub-admin roles
 */
router.post('/verify', verifyFirebaseToken, requireSubAdmin, async (req, res) => {
  try {
    const { qrData, blockchainId, uid, hash } = req.body;
    
    console.log('🔍 Digital ID verification request:', { qrData, blockchainId, uid, hash });
    
    let targetUid = uid;
    let targetBlockchainId = blockchainId;
    
    // If QR data is provided, parse it
    if (qrData) {
      try {
        const parsedQR = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        targetUid = parsedQR.uid;
        targetBlockchainId = parsedQR.blockchainId;
        
        // Verify QR data integrity using hash
        if (parsedQR.hash && hash && parsedQR.hash !== hash) {
          return res.status(400).json({
            success: false,
            message: 'QR code data integrity check failed'
          });
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format'
        });
      }
    }
    
    if (!targetUid && !targetBlockchainId) {
      return res.status(400).json({
        success: false,
        message: 'Either UID or blockchain ID is required'
      });
    }
    
    // Get user data from Firestore
    let userDoc;
    if (targetUid) {
      userDoc = await db.collection('users').doc(targetUid).get();
    } else {
      // Find user by blockchain ID
      const usersSnapshot = await db.collection('users')
        .where('blockchainId', '==', targetBlockchainId)
        .limit(1)
        .get();
      
      if (!usersSnapshot.empty) {
        userDoc = usersSnapshot.docs[0];
        targetUid = userDoc.id;
      }
    }
    
    if (!userDoc || !userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userData = userDoc.data();
    
    // Check if user has approved KYC
    if (userData.kycStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'User KYC not approved'
      });
    }
    
    // Get KYC data
    const kycDoc = await db.collection('kyc').doc(targetUid).get();
    if (!kycDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'KYC data not found'
      });
    }
    
    const kycData = kycDoc.data();
    
    // Get digital identity from blockchain service
    const digitalIdResult = blockchainService.getDigitalIdentity(targetUid);
    
    if (!digitalIdResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Digital ID not found in blockchain'
      });
    }
    
    // Prepare limited profile data for sub-admin access
    const profileData = {
      // Basic identity information
      fullName: kycData.fullName,
      dateOfBirth: kycData.dateOfBirth,
      nationality: kycData.address?.country || 'Not specified',
      governmentIdType: kycData.governmentIdType,
      
      // Digital ID information
      blockchainId: userData.blockchainId,
      digitalIdStatus: digitalIdResult.digitalId.status,
      verificationLevel: digitalIdResult.digitalId.verificationLevel,
      createdAt: digitalIdResult.digitalId.createdAt,
      expiryDate: digitalIdResult.digitalId.expiryDate,
      
      // Verification status
      kycStatus: userData.kycStatus,
      kycApprovedAt: userData.kycApprovedAt,
      
      // Contact information (limited)
      email: userData.email,
      
      // Emergency contact (if available)
      emergencyContact: kycData.emergencyContact || 'Not provided',
      
      // Travel information (if available)
      lastLoginLocation: userData.lastLoginLocation || 'Not available',
      registrationDate: userData.createdAt
    };
    
    // Log the verification attempt
    console.log(`✅ Digital ID verified for user ${targetUid} by ${req.user.role}: ${req.user.uid}`);
    
    // Store verification log
    await db.collection('verification_logs').add({
      verifiedUserId: targetUid,
      verifiedByUserId: req.user.uid,
      verifiedByRole: req.user.role,
      verificationMethod: qrData ? 'QR_SCAN' : 'MANUAL_INPUT',
      timestamp: new Date().toISOString(),
      blockchainId: targetBlockchainId
    });
    
    res.json({
      success: true,
      message: 'Digital ID verified successfully',
      digitalId: {
        id: digitalIdResult.digitalId.id,
        status: digitalIdResult.digitalId.status,
        verificationLevel: digitalIdResult.digitalId.verificationLevel,
        network: digitalIdResult.digitalId.network
      },
      userData: profileData,
      verificationTimestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'verifyDigitalId' });
    res.status(500).json({
      success: false,
      message: 'Digital ID verification failed',
      error: error.message
    });
  }
});

/**
 * Get Digital ID by UID or blockchain ID
 * For admin/sub-admin to look up specific users
 */
router.get('/lookup/:identifier', verifyFirebaseToken, requireSubAdmin, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { type } = req.query; // 'uid' or 'blockchainId'
    
    let userDoc;
    let targetUid;
    
    if (type === 'uid' || identifier.length === 28) {
      // Lookup by UID
      userDoc = await db.collection('users').doc(identifier).get();
      targetUid = identifier;
    } else {
      // Lookup by blockchain ID
      const usersSnapshot = await db.collection('users')
        .where('blockchainId', '==', identifier)
        .limit(1)
        .get();
      
      if (!usersSnapshot.empty) {
        userDoc = usersSnapshot.docs[0];
        targetUid = userDoc.id;
      }
    }
    
    if (!userDoc || !userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userData = userDoc.data();
    
    if (userData.kycStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'User KYC not approved'
      });
    }
    
    // Get digital identity
    const digitalIdResult = blockchainService.getDigitalIdentity(targetUid);
    
    if (!digitalIdResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Digital ID not found'
      });
    }
    
    res.json({
      success: true,
      digitalId: digitalIdResult.digitalId,
      userData: {
        uid: targetUid,
        email: userData.email,
        name: userData.name,
        kycStatus: userData.kycStatus,
        blockchainId: userData.blockchainId
      }
    });
    
  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'lookupDigitalId' });
    res.status(500).json({
      success: false,
      message: 'Digital ID lookup failed',
      error: error.message
    });
  }
});

/**
 * Get verification history for admin dashboard
 */
router.get('/verification-history', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const logsSnapshot = await db.collection('verification_logs')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const logs = [];
    for (const doc of logsSnapshot.docs) {
      const logData = doc.data();
      
      // Get user details
      const userDoc = await db.collection('users').doc(logData.verifiedUserId).get();
      const verifierDoc = await db.collection('users').doc(logData.verifiedByUserId).get();
      
      logs.push({
        id: doc.id,
        ...logData,
        verifiedUserName: userDoc.exists ? userDoc.data().name : 'Unknown',
        verifiedUserEmail: userDoc.exists ? userDoc.data().email : 'Unknown',
        verifierName: verifierDoc.exists ? verifierDoc.data().name : 'Unknown',
        verifierEmail: verifierDoc.exists ? verifierDoc.data().email : 'Unknown'
      });
    }
    
    res.json({
      success: true,
      logs,
      total: logs.length
    });
    
  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getVerificationHistory' });
    res.status(500).json({
      success: false,
      message: 'Failed to get verification history',
      error: error.message
    });
  }
});

module.exports = router;
