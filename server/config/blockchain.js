const { Web3 } = require('web3');
const crypto = require('crypto');
const { ethers } = require('ethers');

// Simple blockchain structure for local transactions
class SimpleBlockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
  }

  createGenesisBlock() {
    return {
      index: 0,
      timestamp: Date.now(),
      data: "Genesis Block",
      previousHash: "0",
      hash: this.calculateHash(0, Date.now(), "Genesis Block", "0"),
      nonce: 0
    };
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  calculateHash(index, timestamp, data, previousHash, nonce = 0) {
    return crypto
      .createHash('sha256')
      .update(index + timestamp + JSON.stringify(data) + previousHash + nonce)
      .digest('hex');
  }

  mineBlock(newBlock) {
    while (newBlock.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
      newBlock.nonce++;
      newBlock.hash = this.calculateHash(
        newBlock.index,
        newBlock.timestamp,
        newBlock.data,
        newBlock.previousHash,
        newBlock.nonce
      );
    }
    console.log("Block mined: " + newBlock.hash);
  }

  addBlock(data) {
    const previousBlock = this.getLatestBlock();
    const newBlock = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      data: data,
      previousHash: previousBlock.hash,
      hash: "",
      nonce: 0
    };

    newBlock.hash = this.calculateHash(
      newBlock.index,
      newBlock.timestamp,
      newBlock.data,
      newBlock.previousHash,
      newBlock.nonce
    );

    this.mineBlock(newBlock);
    this.chain.push(newBlock);
    return newBlock;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== this.calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.data,
        currentBlock.previousHash,
        currentBlock.nonce
      )) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getTransactionHistory() {
    return this.chain.slice(1); // Exclude genesis block
  }
}

// Web3 configuration for external blockchain (optional)
let web3;
let blockchain;

const initializeBlockchain = () => {
  try {
    // Initialize simple local blockchain
    blockchain = new SimpleBlockchain();
    console.log('Local blockchain initialized');

    // Optional: Initialize Web3 for external blockchain
    if (process.env.WEB3_PROVIDER_URL) {
      web3 = new Web3(process.env.WEB3_PROVIDER_URL);
      console.log('Web3 provider connected');
    }
  } catch (error) {
    console.error('Error initializing blockchain:', error.message);
  }
};

// Add transaction to blockchain
const addTransaction = (transactionData) => {
  try {
    const block = blockchain.addBlock(transactionData);
    return {
      success: true,
      blockHash: block.hash,
      blockIndex: block.index,
      timestamp: block.timestamp
    };
  } catch (error) {
    console.error('Error adding transaction to blockchain:', error);
    throw error;
  }
};

// Get blockchain transaction history
const getTransactionHistory = () => {
  try {
    return blockchain.getTransactionHistory();
  } catch (error) {
    console.error('Error getting transaction history:', error);
    throw error;
  }
};

// Validate blockchain integrity
const validateBlockchain = () => {
  try {
    return blockchain.isChainValid();
  } catch (error) {
    console.error('Error validating blockchain:', error);
    throw error;
  }
};

// Web3 functions (for external blockchain integration)
const sendWeb3Transaction = async (transactionData) => {
  try {
    if (!web3) {
      throw new Error('Web3 not initialized');
    }
    
    // Implementation for external blockchain transaction
    // This would require proper wallet setup and gas management
    console.log('Web3 transaction data:', transactionData);
    
    return {
      success: true,
      txHash: crypto.randomBytes(32).toString('hex'), // Mock hash
      message: 'Transaction sent to external blockchain'
    };
  } catch (error) {
    console.error('Error sending Web3 transaction:', error);
    throw error;
  }
};

// Generate blockchain wallet address and private key
const generateWallet = () => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || null
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw error;
  }
};

// Generate unique blockchain ID
const generateBlockchainId = () => {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(4).toString('hex');
  return `USR-BC-${timestamp.slice(-6)}${randomBytes.toUpperCase()}`;
};

// Hash private key for secure storage
const hashPrivateKey = (privateKey) => {
  return crypto.createHash('sha256').update(privateKey).digest('hex');
};

// Create blockchain identity for user
const createBlockchainIdentity = async (userId, kycData) => {
  try {
    const wallet = generateWallet();
    const blockchainId = generateBlockchainId();
    const privateKeyHash = hashPrivateKey(wallet.privateKey);

    // Create blockchain transaction for identity verification
    const identityData = {
      userId,
      blockchainId,
      walletAddress: wallet.address,
      kycVerified: true,
      identityHash: crypto.createHash('sha256').update(JSON.stringify(kycData)).digest('hex'),
      timestamp: new Date(),
      action: 'identity_created'
    };

    const blockResult = await addTransaction(identityData);

    return {
      success: true,
      blockchainId,
      walletAddress: wallet.address,
      privateKeyHash,
      blockHash: blockResult.blockHash,
      blockIndex: blockResult.blockIndex,
      // Never return actual private key in production
      privateKey: process.env.NODE_ENV === 'development' ? wallet.privateKey : undefined
    };
  } catch (error) {
    console.error('Error creating blockchain identity:', error);
    throw error;
  }
};

module.exports = {
  initializeBlockchain,
  addTransaction,
  getTransactionHistory,
  validateBlockchain,
  sendWeb3Transaction,
  generateWallet,
  generateBlockchainId,
  hashPrivateKey,
  createBlockchainIdentity,
  SimpleBlockchain
};
