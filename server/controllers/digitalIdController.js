const crypto = require('crypto');
const User = require('../models/User');
const { 
  addTransaction, 
  createBlockchainIdentity,
  generateBlockchainId 
} = require('../config/blockchain');

class DigitalIdController {
  // Generate blockchain-based digital ID
  static async generateDigitalId(req, res) {
    try {
      const { userId } = req.user; // Get from authenticated user
      
      // Check if user exists and is KYC verified
      const user = await User.findOne({ userId });
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (user.kyc.status !== 'verified') {
        return res.status(400).json({ 
          success: false, 
          message: 'KYC verification required before generating Digital ID' 
        });
      }

      // Check if user already has a digital ID
      if (user.digitalId && user.digitalId.id) {
        return res.status(200).json({ 
          success: true, 
          digitalId: user.digitalId,
          message: 'Digital ID already exists' 
        });
      }

      // Generate unique digital ID using existing blockchain
      const digitalId = await this.createBlockchainId(user);
      
      // Save digital ID to user record
      user.digitalId = digitalId;
      user.kycVerified = true; // Ensure this flag is set
      await user.save();

      res.status(201).json({ 
        success: true, 
        digitalId,
        message: 'Digital ID generated successfully' 
      });

    } catch (error) {
      console.error('Error generating digital ID:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate digital ID',
        error: error.message 
      });
    }
  }

  // Create blockchain ID using existing blockchain infrastructure
  static async createBlockchainId(user) {
    try {
      // Use existing blockchain identity creation
      const blockchainIdentity = await createBlockchainIdentity(user._id, {
        fullName: user.kyc?.fullName || user.name,
        email: user.email,
        nationality: user.kyc?.address?.country || 'Unknown',
        dateOfBirth: user.kyc?.dateOfBirth,
        kycVerified: user.kycVerified
      });

      // Create digital ID transaction on blockchain
      const digitalIdData = {
        userId: user._id,
        action: 'digital_id_created',
        digitalId: blockchainIdentity.blockchainId,
        walletAddress: blockchainIdentity.walletAddress,
        kycVerified: user.kycVerified,
        timestamp: new Date()
      };

      const blockResult = await addTransaction(digitalIdData);

      return {
        id: blockchainIdentity.blockchainId,
        blockchainHash: blockResult.blockHash,
        createdAt: new Date().toISOString(),
        network: 'SafeTour Local Blockchain',
        contractAddress: blockchainIdentity.walletAddress,
        tokenId: blockResult.blockIndex,
        verificationLevel: 'Level 3 - Full KYC',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        userData: {
          fullName: user.kyc?.fullName || user.name,
          email: user.email,
          nationality: user.kyc?.address?.country || 'Unknown',
          dateOfBirth: user.kyc?.dateOfBirth,
          kycVerified: user.kycVerified
        },
        securityFeatures: {
          immutable: true,
          cryptographicallySecure: true,
          globallyRecognized: true,
          emergencyAccess: true
        },
        blockchainDetails: {
          walletAddress: blockchainIdentity.walletAddress,
          privateKeyHash: blockchainIdentity.privateKeyHash,
          blockIndex: blockResult.blockIndex
        }
      };
    } catch (error) {
      console.error('Error creating blockchain ID:', error);
      throw error;
    }
  }

  // Verify digital ID
  static async verifyDigitalId(req, res) {
    try {
      const { digitalIdHash } = req.params;
      
      // Find user by digital ID
      const user = await User.findOne({ 'digitalId.id': digitalIdHash });
      
      if (!user || !user.digitalId) {
        return res.status(404).json({ 
          success: false, 
          message: 'Digital ID not found' 
        });
      }

      // Check if ID is expired
      const now = new Date();
      const expiryDate = new Date(user.digitalId.expiryDate);
      
      if (now > expiryDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Digital ID has expired' 
        });
      }

      res.status(200).json({ 
        success: true, 
        digitalId: user.digitalId,
        verified: true,
        message: 'Digital ID verified successfully' 
      });

    } catch (error) {
      console.error('Error verifying digital ID:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to verify digital ID',
        error: error.message 
      });
    }
  }

  // Get user's digital ID
  static async getDigitalId(req, res) {
    try {
      const { userId } = req.user; // Get from authenticated user
      
      const user = await User.findOne({ userId });
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!user.digitalId || !user.digitalId.id) {
        return res.status(404).json({ 
          success: false, 
          message: 'Digital ID not found. Complete KYC verification first.',
          kycStatus: user.kyc?.status || 'pending'
        });
      }

      res.status(200).json({ 
        success: true, 
        digitalId: user.digitalId,
        kycStatus: user.kyc.status,
        blockchainVerified: user.blockchain.isBlockchainVerified
      });

    } catch (error) {
      console.error('Error fetching digital ID:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch digital ID',
        error: error.message 
      });
    }
  }

  // Regenerate digital ID (in case of security concerns)
  static async regenerateDigitalId(req, res) {
    try {
      const { userId } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!user.kycVerified) {
        return res.status(400).json({ 
          success: false, 
          message: 'KYC verification required' 
        });
      }

      // Generate new digital ID
      const newDigitalId = await this.createBlockchainId(user);
      
      // Update user record
      user.digitalId = newDigitalId;
      user.digitalIdHistory = user.digitalIdHistory || [];
      user.digitalIdHistory.push({
        action: 'regenerated',
        timestamp: new Date().toISOString(),
        reason: 'User requested regeneration'
      });
      
      await user.save();

      res.status(200).json({ 
        success: true, 
        digitalId: newDigitalId,
        message: 'Digital ID regenerated successfully' 
      });

    } catch (error) {
      console.error('Error regenerating digital ID:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to regenerate digital ID',
        error: error.message 
      });
    }
  }
}

const generateDigitalId = async (req, res) => {
  return DigitalIdController.generateDigitalId(req, res);
};

const verifyDigitalId = async (req, res) => {
  return DigitalIdController.verifyDigitalId(req, res);
};

const getDigitalId = async (req, res) => {
  return DigitalIdController.getDigitalId(req, res);
};

const regenerateDigitalId = async (req, res) => {
  return DigitalIdController.regenerateDigitalId(req, res);
};

module.exports = {
  generateDigitalId,
  verifyDigitalId,
  getDigitalId,
  regenerateDigitalId
};
