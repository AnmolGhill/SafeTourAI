const express = require('express');
const { verifyFirebaseToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
const walletService = require('../services/walletService');
const logger = require('../utils/logger');

const router = express.Router();

// Get or create wallet for user
router.get('/create', verifyFirebaseToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Generate/recover deterministic wallet
    const walletData = await walletService.recoverWallet(userData.email, req.user.uid);
    
    // Store wallet address as real blockchain ID in user document
    await db.collection('users').doc(req.user.uid).update({
      blockchainId: walletData.address,
      walletAddress: walletData.address,
      walletCreated: true,
      walletCreatedAt: walletData.createdAt
    });

    // Return wallet data (without private key for security)
    res.json({
      success: true,
      wallet: {
        address: walletData.address,
        balance: walletData.balance,
        network: walletData.network,
        createdAt: walletData.createdAt,
        lastUpdated: walletData.lastUpdated
      }
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'createWallet' });
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

// Get wallet info
router.get('/info', verifyFirebaseToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Get wallet from cache or recover
    let walletData = walletService.getWallet(req.user.uid);
    
    if (!walletData) {
      walletData = await walletService.recoverWallet(userData.email, req.user.uid);
    } else {
      // Update balance
      await walletService.updateWalletBalance(walletData);
    }

    res.json({
      success: true,
      wallet: {
        address: walletData.address,
        balance: walletData.balance,
        balanceWei: walletData.balanceWei,
        network: walletData.network,
        createdAt: walletData.createdAt,
        lastUpdated: walletData.lastUpdated
      }
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getWalletInfo' });
    res.status(500).json({ error: 'Failed to get wallet info' });
  }
});

// Get seed phrase (encrypted)
router.get('/seed-phrase', verifyFirebaseToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Get wallet from cache or recover
    let walletData = walletService.getWallet(req.user.uid);
    
    if (!walletData) {
      walletData = await walletService.recoverWallet(userData.email, req.user.uid);
    }

    // Return encrypted seed phrase
    const encryptedSeedPhrase = walletService.encryptSensitiveData(walletData.mnemonic, req.user.uid);

    res.json({
      success: true,
      seedPhrase: walletData.mnemonic, // In production, you might want to encrypt this
      encryptedSeedPhrase: encryptedSeedPhrase,
      warning: 'Keep your seed phrase secure. Never share it with anyone.'
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getSeedPhrase' });
    res.status(500).json({ error: 'Failed to get seed phrase' });
  }
});

// Send transaction
router.post('/send', verifyFirebaseToken, async (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    if (!toAddress || !amount) {
      return res.status(400).json({ error: 'To address and amount are required' });
    }

    // Validate Ethereum address
    if (!walletService.web3.utils.isAddress(toAddress)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Send transaction
    const transactionResult = await walletService.sendTransaction(req.user.uid, toAddress, amount);

    // Log transaction in database
    await db.collection('transactions').add({
      userId: req.user.uid,
      transactionHash: transactionResult.transactionHash,
      from: transactionResult.from,
      to: transactionResult.to,
      amount: transactionResult.amount,
      gasUsed: transactionResult.gasUsed,
      gasPrice: transactionResult.gasPrice,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });

    res.json({
      success: true,
      transaction: transactionResult
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'sendTransaction' });
    res.status(500).json({ error: error.message || 'Failed to send transaction' });
  }
});

// Get transaction history
router.get('/transactions', verifyFirebaseToken, async (req, res) => {
  try {
    // Get transactions from database
    const transactionsSnapshot = await db.collection('transactions')
      .where('userId', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Also get blockchain transactions
    const blockchainTransactions = await walletService.getTransactionHistory(req.user.uid);

    res.json({
      success: true,
      transactions: transactions,
      blockchainTransactions: blockchainTransactions
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'getTransactions' });
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

// Update wallet balance
router.post('/refresh-balance', verifyFirebaseToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Get wallet and update balance
    let walletData = walletService.getWallet(req.user.uid);
    
    if (!walletData) {
      walletData = await walletService.recoverWallet(userData.email, req.user.uid);
    }

    await walletService.updateWalletBalance(walletData);

    res.json({
      success: true,
      balance: walletData.balance,
      balanceWei: walletData.balanceWei,
      lastUpdated: walletData.lastUpdated
    });

  } catch (error) {
    logger.errorWithContext(error, req, { operation: 'refreshBalance' });
    res.status(500).json({ error: 'Failed to refresh balance' });
  }
});

module.exports = router;
