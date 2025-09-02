const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { db, storage } = require('../config/firebase');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

const router = express.Router();

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

    // Upload files to Firebase Storage (with fallback)
    const documentUrls = {};

    try {
      const bucket = storage.bucket();
      
      if (req.files.document && req.files.document[0]) {
        const documentFile = req.files.document[0];
        const documentFileName = `kyc/${req.user.uid}/document_${Date.now()}_${documentFile.originalname}`;
        const documentFileRef = bucket.file(documentFileName);
        
        await documentFileRef.save(documentFile.buffer, {
          metadata: {
            contentType: documentFile.mimetype,
          },
        });
        
        await documentFileRef.makePublic();
        documentUrls.document = `https://storage.googleapis.com/${bucket.name}/${documentFileName}`;
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
        
        await selfieFileRef.makePublic();
        documentUrls.selfie = `https://storage.googleapis.com/${bucket.name}/${selfieFileName}`;
      }
    } catch (storageError) {
      logger.errorWithContext(storageError, req, { operation: 'fileUpload' });
      // Continue without file uploads for now
      if (req.files.document && req.files.document[0]) {
        documentUrls.document = `placeholder_document_${req.user.uid}`;
      }
      if (req.files.selfie && req.files.selfie[0]) {
        documentUrls.selfie = `placeholder_selfie_${req.user.uid}`;
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

    return res.status(201).json({
      message: 'KYC submitted successfully',
      status: 'submitted',
      submittedAt: kycData.submittedAt
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'kycSubmission' });
    res.status(500).json({ error: 'KYC submission failed', details: error.message });
  }
});

// Get KYC status
router.get('/status', verifyFirebaseToken, async (req, res) => {
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

// Admin: Get all pending KYC applications
router.get('/admin/pending', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const pendingKycs = await db.collection('kyc')
      .where('status', 'in', ['submitted', 'under_review'])
      .orderBy('submittedAt', 'desc')
      .get();

    const applications = [];
    
    for (const doc of pendingKycs.docs) {
      const kycData = doc.data();
      
      // Get user details
      const userDoc = await db.collection('users').doc(kycData.uid).get();
      const userData = userDoc.data();

      applications.push({
        id: doc.id,
        ...kycData,
        userEmail: userData.email,
        userName: userData.name
      });
    }

    res.json({ applications });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getPendingKYCs' });
    res.status(500).json({ error: 'Failed to get pending KYC applications' });
  }
});

// Admin: Review KYC application
router.post('/admin/review/:uid', verifyFirebaseToken, requireAdmin, [
  body('action').isIn(['approve', 'reject']),
  body('rejectionReason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uid } = req.params;
    const { action, rejectionReason } = req.body;

    const kycDoc = await db.collection('kyc').doc(uid).get();
    
    if (!kycDoc.exists) {
      return res.status(404).json({ error: 'KYC application not found' });
    }

    const kycData = kycDoc.data();
    
    if (kycData.status === 'approved' || kycData.status === 'rejected') {
      return res.status(400).json({ error: 'KYC already reviewed' });
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user.uid
    };

    if (action === 'reject' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    // If approved, generate blockchain ID
    if (action === 'approve') {
      try {
        const blockchainId = await blockchainService.generateBlockchainId(uid, kycData);
        updateData.blockchainId = blockchainId;
        
        // Update user's blockchain ID
        await db.collection('users').doc(uid).update({
          blockchainId,
          kycStatus: 'approved'
        });
        
        console.log(`Blockchain ID generated for user ${uid}: ${blockchainId}`);
      } catch (blockchainError) {
        logger.errorWithContext(blockchainError, req, { operation: 'blockchainIdGeneration', uid });
        // Continue with approval but without blockchain ID
        updateData.blockchainId = null;
      }
    }

    // Update KYC document
    await db.collection('kyc').doc(uid).update(updateData);

    // Update user's KYC status
    await db.collection('users').doc(uid).update({
      kycStatus: updateData.status
    });

    res.json({
      message: `KYC ${action}d successfully`,
      status: updateData.status,
      blockchainId: updateData.blockchainId
    });

    console.log(`KYC ${action}d for user ${uid} by admin ${req.user.uid}`);

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'kycReview', uid });
    res.status(500).json({ error: 'KYC review failed', details: error.message });
  }
});

// Admin: Get KYC statistics
router.get('/admin/stats', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const [submitted, approved, rejected, total] = await Promise.all([
      db.collection('kyc').where('status', '==', 'submitted').get(),
      db.collection('kyc').where('status', '==', 'approved').get(),
      db.collection('kyc').where('status', '==', 'rejected').get(),
      db.collection('kyc').get()
    ]);

    res.json({
      stats: {
        total: total.size,
        submitted: submitted.size,
        approved: approved.size,
        rejected: rejected.size,
        pending: submitted.size
      }
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getKYCStats' });
    res.status(500).json({ error: 'Failed to get KYC statistics' });
  }
});

module.exports = router;
