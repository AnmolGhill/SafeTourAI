const express = require('express');
const router = express.Router();
const DigitalIdController = require('../controllers/digitalIdController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Generate digital ID (requires authentication and KYC)
router.post('/generate', authenticateToken, DigitalIdController.generateDigitalId);

// Get user's digital ID
router.get('/user', authenticateToken, DigitalIdController.getDigitalId);

// Verify digital ID by hash
router.get('/verify/:digitalIdHash', DigitalIdController.verifyDigitalId);

// Regenerate digital ID
router.post('/regenerate', authenticateToken, DigitalIdController.regenerateDigitalId);

module.exports = router;
