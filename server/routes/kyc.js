const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { db, storage } = require('../config/firebase');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth');
const { statusLimiter } = require('../middleware/rateLimiter');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

const router = express.Router();

// Health check endpoint for KYC service
router.get('/health', async (req, res) => {
  try {
    // Quick database connectivity test
    const testQuery = await db.collection('kyc').limit(1).get();
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      queryTime: Date.now(),
      kycCount: testQuery.size
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple test endpoint for admin access
router.get('/admin/test', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    console.log('🧪 Admin test endpoint hit');
    console.log('👤 User:', req.user);
    
    // Simple count query without complex filters
    const totalKycs = await db.collection('kyc').get();
    
    res.json({
      success: true,
      message: 'Admin access working',
      user: req.user,
      totalKycs: totalKycs.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Admin test error:', error);
    res.status(500).json({
      error: 'Admin test failed',
      details: error.message
    });
  }
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'document') {
      // Accept images and PDFs for documents
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Invalid document format. Only images and PDFs are allowed.'));
      }
    } else if (file.fieldname === 'selfie') {
      // Accept only images for selfies
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid selfie format. Only images are allowed.'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

// Submit KYC application
router.post('/submit', verifyFirebaseToken, upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), [
  body('fullName').trim().isLength({ min: 2 }),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('governmentIdType').isIn(['aadhaar', 'passport', 'driving_license']),
  body('governmentIdNumber').trim().isLength({ min: 5 }),
  body('consentGiven').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      dateOfBirth,
      gender,
      address,
      governmentIdType,
      governmentIdNumber,
      consentGiven
    } = req.body;

    if (!consentGiven || consentGiven === 'false') {
      return res.status(400).json({ error: 'Consent is required for KYC submission' });
    }

    // Check if KYC already exists
    const existingKyc = await db.collection('kyc').doc(req.user.uid).get();
    if (existingKyc.exists) {
      const kycData = existingKyc.data();
      if (kycData.status === 'approved') {
        return res.status(400).json({ error: 'KYC already approved' });
      }
      if (kycData.status === 'submitted' || kycData.status === 'under_review') {
        return res.status(400).json({ error: 'KYC already submitted and under review' });
      }
    }

    // Store files with proper fallback mechanism
    const documentUrls = {};
    const documentData = {};

    try {
      // Try Firebase Storage first
      const bucketName = process.env.FIREBASE_PROJECT_ID + '.appspot.com';
      const bucket = storage.bucket(bucketName);
      
      if (req.files.document && req.files.document[0]) {
        const documentFile = req.files.document[0];
        const documentFileName = `kyc/${req.user.uid}/document_${Date.now()}_${documentFile.originalname}`;
        const documentFileRef = bucket.file(documentFileName);
        
        await documentFileRef.save(documentFile.buffer, {
          metadata: {
            contentType: documentFile.mimetype,
          },
        });
        
        // Get signed URL instead of making public
        const [signedUrl] = await documentFileRef.getSignedUrl({
          action: 'read',
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        
        documentUrls.document = signedUrl;
        documentData.document = {
          fileName: documentFile.originalname,
          mimeType: documentFile.mimetype,
          size: documentFile.size,
          storagePath: documentFileName
        };
      }

      if (req.files.selfie && req.files.selfie[0]) {
        const selfieFile = req.files.selfie[0];
        const selfieFileName = `kyc/${req.user.uid}/selfie_${Date.now()}_${selfieFile.originalname}`;
        const selfieFileRef = bucket.file(selfieFileName);
        
        await selfieFileRef.save(selfieFile.buffer, {
          metadata: {
            contentType: selfieFile.mimetype,
          },
        });
        
        // Get signed URL instead of making public
        const [signedUrl] = await selfieFileRef.getSignedUrl({
          action: 'read',
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        
        documentUrls.selfie = signedUrl;
        documentData.selfie = {
          fileName: selfieFile.originalname,
          mimeType: selfieFile.mimetype,
          size: selfieFile.size,
          storagePath: selfieFileName
        };
      }
    } catch (storageError) {
      logger.errorWithContext(storageError, req, { operation: 'fileUpload' });
      
      // Fallback: Store file data as base64 in Firestore for admin viewing
      if (req.files.document && req.files.document[0]) {
        const documentFile = req.files.document[0];
        const base64Data = documentFile.buffer.toString('base64');
        documentUrls.document = `data:${documentFile.mimetype};base64,${base64Data}`;
        documentData.document = {
          fileName: documentFile.originalname,
          mimeType: documentFile.mimetype,
          size: documentFile.size,
          storageType: 'base64_fallback'
        };
      }
      
      if (req.files.selfie && req.files.selfie[0]) {
        const selfieFile = req.files.selfie[0];
        const base64Data = selfieFile.buffer.toString('base64');
        documentUrls.selfie = `data:${selfieFile.mimetype};base64,${base64Data}`;
        documentData.selfie = {
          fileName: selfieFile.originalname,
          mimeType: selfieFile.mimetype,
          size: selfieFile.size,
          storageType: 'base64_fallback'
        };
      }
    }

    // Parse address if it's a string
    let parsedAddress;
    try {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid address format' });
    }

    // Store KYC data in Firestore
    const kycData = {
      uid: req.user.uid,
      fullName,
      dateOfBirth,
      gender,
      address: parsedAddress,
      governmentIdType,
      governmentIdNumber,
      consentGiven: true,
      documents: documentUrls,
      documentMetadata: documentData,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      blockchainId: null
    };

    await db.collection('kyc').doc(req.user.uid).set(kycData);

    // Update user's KYC status
    await db.collection('users').doc(req.user.uid).update({
      kycStatus: 'submitted'
    });

    console.log(`KYC submitted for user: ${req.user.uid}`);
    console.log(`Documents stored: ${Object.keys(documentUrls).join(', ')}`);
    console.log(`Document metadata: ${JSON.stringify(documentData, null, 2)}`);

    return res.status(201).json({
      message: 'KYC submitted successfully',
      status: 'submitted',
      submittedAt: kycData.submittedAt,
      documentsUploaded: Object.keys(documentUrls)
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'kycSubmission' });
    res.status(500).json({ error: 'KYC submission failed', details: error.message });
  }
});

// Get KYC status
router.get('/status', statusLimiter, verifyFirebaseToken, async (req, res) => {
  try {
    const kycDoc = await db.collection('kyc').doc(req.user.uid).get();
    
    if (!kycDoc.exists) {
      return res.json({ status: 'not_submitted' });
    }

    const kycData = kycDoc.data();
    
    res.json({
      status: kycData.status,
      submittedAt: kycData.submittedAt,
      reviewedAt: kycData.reviewedAt,
      rejectionReason: kycData.rejectionReason,
      blockchainId: kycData.blockchainId
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getKYCStatus' });
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

// Get KYC details (for user)
router.get('/details', verifyFirebaseToken, async (req, res) => {
  try {
    const kycDoc = await db.collection('kyc').doc(req.user.uid).get();
    
    if (!kycDoc.exists) {
      return res.status(404).json({ error: 'KYC not found' });
    }

    const kycData = kycDoc.data();
    
    // Remove sensitive data for regular users
    const sanitizedData = {
      fullName: kycData.fullName,
      dateOfBirth: kycData.dateOfBirth,
      gender: kycData.gender,
      address: kycData.address,
      governmentIdType: kycData.governmentIdType,
      status: kycData.status,
      submittedAt: kycData.submittedAt,
      reviewedAt: kycData.reviewedAt,
      rejectionReason: kycData.rejectionReason,
      blockchainId: kycData.blockchainId
    };

    res.json(sanitizedData);

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getKYCDetails' });
    res.status(500).json({ error: 'Failed to get KYC details' });
  }
});

// Admin: Get all pending KYC applications (simplified version)
router.get('/admin/pending', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Admin pending KYC request received');
    console.log('👤 User:', req.user);
    
    // Simplified approach: get all KYCs and filter in memory
    console.log('🔍 Getting all KYC documents...');
    const allKycs = await db.collection('kyc').get();
    console.log(`📊 Found ${allKycs.size} total KYC documents`);
    
    // Filter for pending statuses in memory
    const pendingDocs = allKycs.docs.filter(doc => {
      const data = doc.data();
      return ['submitted', 'under_review'].includes(data.status);
    });
    
    console.log(`📋 Found ${pendingDocs.length} pending KYC applications`);
    
    // Build applications array with mock user data for now
    const applications = pendingDocs.map(doc => {
      const kycData = doc.data();
      
      return {
        id: doc.id,
        ...kycData,
        userEmail: kycData.userEmail || 'user@example.com',
        userName: kycData.userName || kycData.fullName || 'Unknown User'
      };
    }).sort((a, b) => {
      const aTime = new Date(a.submittedAt || 0);
      const bTime = new Date(b.submittedAt || 0);
      return bTime - aTime; // desc order
    });

    console.log(`✅ Returning ${applications.length} applications`);
    res.json({ applications });

  } catch (error) {
    console.error('❌ Error in getPendingKYCs:', error);
    console.error('❌ Error stack:', error.stack);
    logger.errorWithContext(error, req, { operation: 'getPendingKYCs' });
    
    res.status(500).json({ 
      error: 'Failed to get pending KYC applications',
      details: error.message,
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Remove duplicate KYC review route - handled in admin.js

// Admin: Get KYC documents for viewing
router.get('/admin/documents/:userId', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const kycDoc = await db.collection('kyc').doc(userId).get();
    if (!kycDoc.exists) {
      return res.status(404).json({ error: 'KYC not found' });
    }

    const kycData = kycDoc.data();
    
    // Return document URLs and metadata for admin viewing
    res.json({
      success: true,
      documents: kycData.documents || {},
      documentMetadata: kycData.documentMetadata || {},
      userInfo: {
        fullName: kycData.fullName,
        governmentIdType: kycData.governmentIdType,
        status: kycData.status,
        submittedAt: kycData.submittedAt
      }
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getKYCDocuments' });
    res.status(500).json({ error: 'Failed to get KYC documents' });
  }
});

// Admin: Get KYC statistics
router.get('/admin/stats', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Admin stats request received');
    console.log('👤 User:', req.user);
    
    // Set a timeout for the stats query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Stats query timeout')), 10000);
    });

    const statsPromise = async () => {
      console.log('📊 Getting all KYC documents for stats...');
      // Simplified: get all documents and count in memory
      const allKycs = await db.collection('kyc').get();
      console.log(`📊 Found ${allKycs.size} total KYC documents`);
      
      let submitted = 0, approved = 0, rejected = 0;
      
      allKycs.docs.forEach(doc => {
        const status = doc.data().status;
        switch (status) {
          case 'submitted':
            submitted++;
            break;
          case 'approved':
            approved++;
            break;
          case 'rejected':
            rejected++;
            break;
        }
      });

      return {
        total: allKycs.size,
        submitted,
        approved,
        rejected,
        pending: submitted
      };
    };

    const stats = await Promise.race([statsPromise(), timeoutPromise]);
    
    res.json({ stats });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getKYCStats' });
    
    if (error.message.includes('timeout')) {
      // Return fallback stats on timeout
      res.json({
        stats: {
          total: 0,
          submitted: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to get KYC statistics' });
    }
  }
});

module.exports = router;
