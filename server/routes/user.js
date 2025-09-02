const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { verifyFirebaseToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Get user profile data if exists
    const profileDoc = await db.collection('userProfiles').doc(req.user.uid).get();
    const profileData = profileDoc.exists ? profileDoc.data() : {};

    res.json({
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        kycStatus: userData.kycStatus,
        profileComplete: userData.profileComplete,
        blockchainId: userData.blockchainId,
        ...profileData
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    logger.errorWithContext(error, req, { operation: 'getProfile' });
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/profile', verifyFirebaseToken, [
  body('profile.fullName').optional().trim().isLength({ min: 2 }),
  body('profile.age').optional().isInt({ min: 1, max: 120 }),
  body('profile.dateOfBirth').optional().isISO8601(),
  body('profile.gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say']),
  body('profile.contactNumber').optional().isMobilePhone(),
  body('nationality').optional().trim().isLength({ min: 2 }),
  body('occupation').optional().trim().isLength({ min: 2 }),
  body('address').optional().trim().isLength({ min: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const profileData = {
      ...req.body.profile,
      updatedAt: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(profileData).forEach(key => {
      if (profileData[key] === undefined) {
        delete profileData[key];
      }
    });

    // Update user profile
    await db.collection('userProfiles').doc(req.user.uid).set(profileData, { merge: true });

    // Update profile completion status
    const requiredFields = ['fullName', 'age', 'dateOfBirth', 'gender', 'contactNumber'];
    const hasRequiredFields = requiredFields.every(field => 
      profileData[field] !== undefined && profileData[field] !== ''
    );

    if (hasRequiredFields) {
      await db.collection('users').doc(req.user.uid).update({
        profileComplete: true
      });
    }

    res.json({
      message: 'Profile updated successfully',
      profileComplete: hasRequiredFields
    });

    logger.info(`Profile updated for user: ${req.user.uid}`);

  } catch (error) {
    console.error('Update user profile error:', error);
    logger.errorWithContext(error, req, { operation: 'updateProfile' });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update emergency contacts
router.put('/emergency-contacts', verifyFirebaseToken, [
  body('emergencyContacts').isArray().isLength({ min: 1, max: 5 }),
  body('emergencyContacts.*.name').trim().isLength({ min: 2 }),
  body('emergencyContacts.*.phone').isMobilePhone(),
  body('emergencyContacts.*.relation').isIn(['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Colleague', 'Other']),
  body('emergencyContacts.*.email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { emergencyContacts } = req.body;

    await db.collection('userProfiles').doc(req.user.uid).set({
      emergencyContacts,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ message: 'Emergency contacts updated successfully' });

    logger.info(`Emergency contacts updated for user: ${req.user.uid}`);

  } catch (error) {
    logger.error('Update emergency contacts error:', error);
    res.status(500).json({ error: 'Failed to update emergency contacts' });
  }
});

// Update health information
router.put('/health-info', verifyFirebaseToken, [
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('allergies').optional().trim(),
  body('medicalConditions').optional().trim(),
  body('medications').optional().trim(),
  body('doctorName').optional().trim(),
  body('doctorPhone').optional().isMobilePhone(),
  body('healthInsurance').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const healthData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(healthData).forEach(key => {
      if (healthData[key] === undefined) {
        delete healthData[key];
      }
    });

    await db.collection('userProfiles').doc(req.user.uid).set(healthData, { merge: true });

    res.json({ message: 'Health information updated successfully' });

    logger.info(`Health info updated for user: ${req.user.uid}`);

  } catch (error) {
    logger.error('Update health info error:', error);
    res.status(500).json({ error: 'Failed to update health information' });
  }
});

// Update security settings
router.put('/security-settings', verifyFirebaseToken, [
  body('sosPreference').optional().isIn(['Button', 'Voice', 'Shake', 'Double Tap', 'Volume Keys']),
  body('privacySettings').optional().isIn(['Public', 'Friends Only', 'Family Only', 'Emergency Only', 'Private']),
  body('blockchainConsent').optional().isBoolean(),
  body('safeWord').optional().trim().isLength({ min: 3, max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const securityData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(securityData).forEach(key => {
      if (securityData[key] === undefined) {
        delete securityData[key];
      }
    });

    await db.collection('userProfiles').doc(req.user.uid).set(securityData, { merge: true });

    res.json({ message: 'Security settings updated successfully' });

    logger.info(`Security settings updated for user: ${req.user.uid}`);

  } catch (error) {
    logger.error('Update security settings error:', error);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

// Update AI preferences
router.put('/ai-preferences', verifyFirebaseToken, [
  body('predictiveAlerts').optional().isBoolean(),
  body('smartRecommendations').optional().isBoolean(),
  body('behaviorAnalysis').optional().isBoolean(),
  body('voiceAssistant').optional().isBoolean(),
  body('aiLearningLevel').optional().isIn(['Basic', 'Moderate', 'Advanced']),
  body('aiNotificationFreq').optional().isIn(['Minimal', 'Normal', 'Frequent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const aiData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Remove undefined fields
    Object.keys(aiData).forEach(key => {
      if (aiData[key] === undefined) {
        delete aiData[key];
      }
    });

    await db.collection('userProfiles').doc(req.user.uid).set(aiData, { merge: true });

    res.json({ message: 'AI preferences updated successfully' });

    logger.info(`AI preferences updated for user: ${req.user.uid}`);

  } catch (error) {
    logger.error('Update AI preferences error:', error);
    res.status(500).json({ error: 'Failed to update AI preferences' });
  }
});

// Get user dashboard data
router.get('/dashboard', verifyFirebaseToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const profileDoc = await db.collection('userProfiles').doc(req.user.uid).get();
    const kycDoc = await db.collection('kyc').doc(req.user.uid).get();

    const userData = userDoc.exists ? userDoc.data() : {};
    const profileData = profileDoc.exists ? profileDoc.data() : {};
    const kycData = kycDoc.exists ? kycDoc.data() : {};

    res.json({
      user: {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        kycStatus: userData.kycStatus,
        profileComplete: userData.profileComplete,
        blockchainId: userData.blockchainId
      },
      profile: profileData,
      kyc: {
        status: kycData.status || 'not_submitted',
        submittedAt: kycData.submittedAt,
        reviewedAt: kycData.reviewedAt,
        blockchainId: kycData.blockchainId
      }
    });

  } catch (error) {
    logger.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Delete user account
router.delete('/account', verifyFirebaseToken, async (req, res) => {
  try {
    const batch = db.batch();

    // Delete user data from all collections
    const collections = ['users', 'userProfiles', 'kyc', 'otps'];
    
    for (const collection of collections) {
      const docRef = db.collection(collection).doc(req.user.uid);
      batch.delete(docRef);
    }

    await batch.commit();

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(req.user.uid);
    } catch (authError) {
      logger.error('Failed to delete user from Firebase Auth:', authError);
    }

    res.json({ message: 'Account deleted successfully' });

    logger.info(`Account deleted for user: ${req.user.uid}`);

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
