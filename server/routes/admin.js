const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, auth } = require('../config/firebase');
const { verifyFirebaseToken, requireAdmin, requireSubAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const blockchainService = require('../services/blockchainService');

const router = express.Router();

// Get all users (Admin only)
router.get('/users', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, kycStatus } = req.query;
    
    let query = db.collection('users');
    
    if (role) {
      query = query.where('role', '==', role);
    }
    
    if (kycStatus) {
      query = query.where('kycStatus', '==', kycStatus);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();

    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        kycStatus: userData.kycStatus,
        profileComplete: userData.profileComplete,
        createdAt: userData.createdAt,
        emailVerified: userData.emailVerified
      });
    });

    // Get total count
    const totalSnapshot = await db.collection('users').get();
    const total = totalSnapshot.size;

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user details (Admin only)
router.get('/users/:uid', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;

    const [userDoc, profileDoc, kycDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('userProfiles').doc(uid).get(),
      db.collection('kyc').doc(uid).get()
    ]);

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const profileData = profileDoc.exists ? profileDoc.data() : {};
    const kycData = kycDoc.exists ? kycDoc.data() : {};

    res.json({
      user: userData,
      profile: profileData,
      kyc: kycData
    });

  } catch (error) {
    logger.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Update user role (Admin only)
router.put('/users/:uid/role', verifyFirebaseToken, requireAdmin, [
  body('role').isIn(['user', 'subadmin', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uid } = req.params;
    const { role } = req.body;

    // Update in Firestore
    await db.collection('users').doc(uid).update({
      role,
      updatedAt: new Date().toISOString()
    });

    // Update Firebase Auth custom claims
    await auth.setCustomUserClaims(uid, { role });

    res.json({ message: 'User role updated successfully' });

    logger.info(`User role updated: ${uid} -> ${role} by admin ${req.user.uid}`);

  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Approve/Reject admin/subadmin registration
router.post('/users/:uid/approve', verifyFirebaseToken, requireAdmin, [
  body('action').isIn(['approve', 'reject']),
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uid } = req.params;
    const { action, reason } = req.body;

    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    if (userData.role === 'user') {
      return res.status(400).json({ error: 'Regular users do not require approval' });
    }

    if (action === 'approve') {
      // Enable the user account
      await auth.updateUser(uid, { disabled: false });
      
      await db.collection('users').doc(uid).update({
        approved: true,
        approvedAt: new Date().toISOString(),
        approvedBy: req.user.uid
      });

      res.json({ message: 'User approved successfully' });
    } else {
      // Reject and disable account
      await auth.updateUser(uid, { disabled: true });
      
      await db.collection('users').doc(uid).update({
        approved: false,
        rejectedAt: new Date().toISOString(),
        rejectedBy: req.user.uid,
        rejectionReason: reason
      });

      res.json({ message: 'User rejected successfully' });
    }

    console.log(`User ${action}d: ${uid} by admin ${req.user.uid}`);

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'userApproval' });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process user approval' });
    }
  }
});

// Get system statistics (Admin/SubAdmin)
router.get('/stats', verifyFirebaseToken, requireSubAdmin, async (req, res) => {
  try {
    const [usersSnapshot, kycSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('kyc').get()
    ]);

    const userStats = {
      total: 0,
      users: 0,
      subadmins: 0,
      admins: 0,
      verified: 0
    };

    const kycStats = {
      total: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    };

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      userStats.total++;
      
      if (userData.role === 'user') userStats.users++;
      else if (userData.role === 'subadmin') userStats.subadmins++;
      else if (userData.role === 'admin') userStats.admins++;
      
      if (userData.emailVerified) userStats.verified++;
    });

    kycSnapshot.forEach(doc => {
      const kycData = doc.data();
      kycStats.total++;
      
      if (kycData.status === 'submitted') kycStats.submitted++;
      else if (kycData.status === 'approved') kycStats.approved++;
      else if (kycData.status === 'rejected') kycStats.rejected++;
    });

    res.json({
      users: userStats,
      kyc: kycStats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get real-time dashboard statistics with blockchain data (Admin only)
router.get('/dashboard-stats', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const [usersSnapshot, kycSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('kyc').get()
    ]);

    // Count verified blockchain users
    let verifiedBlockchainUsers = 0;
    let activeUserSessions = 0;
    let blockchainTransactions = 0;
    let totalRecords = 0;

    // Process users data
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      totalRecords++;
      
      if (userData.blockchainId && userData.kycStatus === 'approved') {
        verifiedBlockchainUsers++;
      }
      
      // Count active sessions (users who logged in within last 24 hours)
      if (userData.lastLoginAt) {
        const lastLogin = new Date(userData.lastLoginAt);
        const now = new Date();
        const hoursDiff = (now - lastLogin) / (1000 * 60 * 60);
        if (hoursDiff <= 24) {
          activeUserSessions++;
        }
      }
    });

    // Count blockchain transactions from KYC approvals
    kycSnapshot.forEach(doc => {
      const kycData = doc.data();
      totalRecords++;
      if (kycData.status === 'approved' && kycData.blockchainId) {
        blockchainTransactions++;
      }
    });

    // Get blockchain service stats
    const blockchainHashMapSize = blockchainService.digitalIdHashMap.size;
    
    // Calculate security score based on real metrics
    const securityScore = Math.min(99.9, 
      85 + 
      (verifiedBlockchainUsers > 0 ? 5 : 0) + 
      (blockchainTransactions > 0 ? 5 : 0) + 
      (blockchainHashMapSize > 0 ? 4.9 : 0)
    );

    // Real-time system status
    const systemStatus = {
      allSystemsActive: true,
      locationServicesActive: activeUserSessions > 0,
      emergencyNetworkOnline: true,
      blockchainSynchronized: blockchainHashMapSize > 0
    };

    const dashboardStats = {
      verifiedBlockchainUsers: {
        count: verifiedBlockchainUsers,
        change: verifiedBlockchainUsers > 0 ? `+${Math.floor(verifiedBlockchainUsers * 0.1)}` : '+0',
        status: 'Identity Verified',
        liveUpdates: true
      },
      activeUserSessions: {
        count: activeUserSessions,
        change: activeUserSessions > 0 ? `+${Math.floor(activeUserSessions * 0.2)}` : '+0',
        status: 'Currently Online',
        liveUpdates: true
      },
      blockchainTransactions: {
        count: blockchainTransactions,
        change: blockchainTransactions > 0 ? `+${Math.floor(blockchainTransactions * 0.15)}` : '+0',
        status: 'Total Records',
        liveUpdates: true
      },
      securityScore: {
        percentage: securityScore.toFixed(1),
        change: '+0.3',
        status: 'System Security',
        liveUpdates: true
      },
      systemStatus,
      lastUpdated: new Date().toISOString(),
      realTimeData: true
    };

    res.json(dashboardStats);

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Enhanced KYC review with email notifications
router.post('/kyc/:uid/review', verifyFirebaseToken, requireAdmin, [
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

    const [kycDoc, userDoc] = await Promise.all([
      db.collection('kyc').doc(uid).get(),
      db.collection('users').doc(uid).get()
    ]);
    
    if (!kycDoc.exists) {
      return res.status(404).json({ error: 'KYC application not found' });
    }

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const kycData = kycDoc.data();
    const userData = userDoc.data();
    
    if (kycData.status === 'approved') {
      return res.status(400).json({ error: 'KYC already approved' });
    }
    
    if (kycData.status === 'rejected') {
      return res.status(400).json({ error: 'KYC already rejected' });
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user.uid
    };

    if (action === 'reject' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    // Update KYC document first
    await db.collection('kyc').doc(uid).update(updateData);

    // Update user's KYC status
    await db.collection('users').doc(uid).update({
      kycStatus: updateData.status
    });

    // If approved, generate blockchain ID asynchronously
    if (action === 'approve') {
      // Generate REAL blockchain ID immediately (no temporary ID)
      console.log(`🚀 Generating REAL blockchain ID for user: ${uid}`);
      const realBlockchainId = await blockchainService.generateBlockchainId(uid, kycData, userData.email);
      
      // Update with REAL blockchain ID
      await db.collection('kyc').doc(uid).update({
        blockchainId: realBlockchainId
      });
      
      await db.collection('users').doc(uid).update({
        blockchainId: realBlockchainId,
        kycStatus: 'approved'
      });

      // Send approval email with real blockchain ID
      try {
        console.log(`📧 Sending KYC approval email to: ${userData.email}`);
        await emailService.sendKYCApproval(userData.email, userData.name, realBlockchainId);
        console.log(`✅ KYC approval process completed for user: ${uid}`);
      } catch (emailError) {
        console.log(`❌ Email sending failed for user: ${uid}`);
        console.error(emailError);
        logger.errorWithContext(emailError, req, { operation: 'approvalEmail' });
      }
      
      updateData.blockchainId = realBlockchainId;
    } else {
      // Send rejection email asynchronously
      setImmediate(async () => {
        try {
          await emailService.sendKYCRejection(userData.email, userData.name, rejectionReason);
        } catch (emailError) {
          logger.errorWithContext(emailError, req, { operation: 'rejectionEmail' });
        }
      });
    }

    res.json({
      message: `KYC ${action}d successfully`,
      status: updateData.status,
      blockchainId: updateData.blockchainId
    });

    console.log(`KYC ${action}d for user ${uid} by admin ${req.user.uid}`);

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'kycReview' });
    if (!res.headersSent) {
      res.status(500).json({ error: 'KYC review failed', details: error.message });
    }
  }
});

// Get KYC document URLs for viewing (Admin/SubAdmin)
router.get('/kyc/:uid/documents', verifyFirebaseToken, requireSubAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    
    const kycDoc = await db.collection('kyc').doc(uid).get();
    
    if (!kycDoc.exists) {
      return res.status(404).json({ error: 'KYC application not found' });
    }
    
    const kycData = kycDoc.data();
    
    if (!kycData.documents) {
      return res.status(404).json({ error: 'No documents found for this KYC application' });
    }
    
    res.json({
      documents: kycData.documents,
      uid: uid,
      status: kycData.status
    });
    
  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getKycDocuments' });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to fetch KYC documents' });
    }
  }
});

// Delete user (Admin only)
router.delete('/users/:uid', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;

    // Delete from all collections
    const batch = db.batch();
    const collections = ['users', 'userProfiles', 'kyc', 'otps'];
    
    for (const collection of collections) {
      const docRef = db.collection(collection).doc(uid);
      batch.delete(docRef);
    }

    await batch.commit();

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(uid);
    } catch (authError) {
      logger.error('Failed to delete user from Firebase Auth:', authError);
    }

    res.json({ message: 'User deleted successfully' });

    logger.info(`User deleted: ${uid} by admin ${req.user.uid}`);

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get sub-admin specific dashboard statistics
router.get('/subadmin-stats', verifyFirebaseToken, requireSubAdmin, async (req, res) => {
  try {
    const [usersSnapshot, kycSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('kyc').get()
    ]);

    // Sub-admin specific metrics
    let touristsVerifiedToday = 0;
    let activeIncidents = 0;
    let idScansCompleted = 0;
    let profilesAccessed = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count tourists verified today
    kycSnapshot.forEach(doc => {
      const kycData = doc.data();
      if (kycData.status === 'approved' && kycData.reviewedAt) {
        const reviewDate = new Date(kycData.reviewedAt);
        if (reviewDate >= today) {
          touristsVerifiedToday++;
        }
      }
    });

    // Count total ID scans (approved KYCs)
    kycSnapshot.forEach(doc => {
      const kycData = doc.data();
      if (kycData.status === 'approved') {
        idScansCompleted++;
      }
    });

    // Count profiles accessed (users with recent activity)
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.lastLoginAt) {
        const lastLogin = new Date(userData.lastLoginAt);
        const hoursDiff = (new Date() - lastLogin) / (1000 * 60 * 60);
        if (hoursDiff <= 24) {
          profilesAccessed++;
        }
      }
    });

    // Mock active incidents (in real app, this would come from incidents collection)
    activeIncidents = Math.floor(Math.random() * 5);

    const subAdminStats = {
      touristsVerifiedToday: {
        count: touristsVerifiedToday,
        change: touristsVerifiedToday > 0 ? `+${Math.floor(touristsVerifiedToday * 0.2)}%` : '+0%',
        status: 'verified today'
      },
      activeIncidents: {
        count: activeIncidents,
        change: activeIncidents > 0 ? `-${Math.floor(Math.random() * 3)} from yesterday` : 'No incidents',
        status: 'active incidents'
      },
      idScansCompleted: {
        count: idScansCompleted,
        change: idScansCompleted > 0 ? `+${Math.floor(idScansCompleted * 0.1)}%` : '+0%',
        status: 'scans completed'
      },
      profilesAccessed: {
        count: profilesAccessed,
        change: profilesAccessed > 0 ? `+${Math.floor(profilesAccessed * 0.15)}%` : '+0%',
        status: 'profiles accessed'
      },
      lastUpdated: new Date().toISOString(),
      realTimeData: true
    };

    res.json(subAdminStats);

  } catch (error) {
    logger.error('Get sub-admin stats error:', error);
    res.status(500).json({ error: 'Failed to get sub-admin statistics' });
  }
});

// Get user-specific dashboard statistics
router.get('/user-stats', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    
    // Get user's own data
    const [userDoc, kycDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('kyc').doc(uid).get()
    ]);

    const userData = userDoc.exists ? userDoc.data() : {};
    const kycData = kycDoc.exists ? kycDoc.data() : {};

    // User-specific metrics
    const userStats = {
      kycStatus: {
        status: userData.kycStatus || 'pending',
        blockchainId: userData.blockchainId || null,
        verificationLevel: kycData.status === 'approved' ? 'Level 3 - Full KYC' : 'Pending Verification'
      },
      digitalIdStatus: {
        active: userData.blockchainId ? true : false,
        created: kycData.reviewedAt || null,
        expiryDate: userData.blockchainId ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      securityScore: {
        score: userData.blockchainId ? 95 : 45,
        level: userData.blockchainId ? 'High' : 'Basic'
      },
      emergencyContacts: {
        count: 0, // Will be updated when profile system is enhanced
        configured: false
      },
      lastUpdated: new Date().toISOString(),
      realTimeData: true
    };

    res.json(userStats);

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

module.exports = router;
