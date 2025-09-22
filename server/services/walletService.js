const { Web3 } = require('web3');
const { ethers } = require('ethers');
const bip39 = require('bip39');
const hdkey = require('hdkey');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');

class WalletService {
  constructor() {
    this.web3 = null;
    this.provider = null;
    this.initializeWeb3();
    
    // In-memory wallet cache for session
    this.walletCache = new Map();
  }

  /**
   * Initialize Web3 with Infura provider
   */
  initializeWeb3() {
    try {
      const providerUrl = process.env.WEB3_PROVIDER_URL || 'https://mainnet.infura.io/v3/9ba30f6b1b414ca480fea169a3527ab2';
      
      // Web3 v4 syntax
      this.web3 = new Web3(providerUrl);
      this.provider = new ethers.JsonRpcProvider(providerUrl);
      
      // Web3 initialized with Infura provider

    } catch (error) {
      console.error('❌ Failed to initialize Web3:', error);
    }
  }

  /**
   * Generate deterministic wallet from user email (like Telegram TON)
   * @param {string} userEmail - User's email address
   * @param {string} userId - User's Firebase UID
   * @returns {object} - Wallet data with address, private key, mnemonic
   */
  async generateDeterministicWallet(userEmail, userId) {
    try {
      console.log(`\n🔐 ========== DETERMINISTIC WALLET GENERATION ==========`);
      console.log(`📧 Email: ${userEmail}`);
      console.log(`🆔 User ID: ${userId}`);

      // Create deterministic seed from email + userId + app secret
      const appSecret = process.env.WALLET_SECRET || 'SafeTourAI-Wallet-Secret-2024';
      const seedString = `${userEmail}-${userId}-${appSecret}`;
      
      // Generate deterministic entropy
      const entropy = crypto.createHash('sha256').update(seedString).digest();
      console.log(`🌱 Deterministic entropy generated`);

      let walletData;

      try {
        // Generate mnemonic from entropy
        const mnemonic = bip39.entropyToMnemonic(entropy);
        console.log(`🔑 Mnemonic generated: ${mnemonic.split(' ').slice(0, 3).join(' ')}...`);

        // Generate HD wallet
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const root = hdkey.fromMasterSeed(seed);
        
        // Use standard Ethereum derivation path
        const derivationPath = "m/44'/60'/0'/0/0";
        const addrNode = root.derive(derivationPath);
        
        const privateKey = '0x' + addrNode.privateKey.toString('hex');
        
        // Try to create ethers wallet
        let wallet;
        let address;
        
        if (this.provider) {
          wallet = new ethers.Wallet(privateKey, this.provider);
          address = wallet.address;
        } else {
          // Fallback: generate address from private key without provider
          const tempWallet = new ethers.Wallet(privateKey);
          address = tempWallet.address;
        }
        
        walletData = {
          address: address,
          privateKey: privateKey,
          mnemonic: mnemonic,
          derivationPath: derivationPath,
          userId: userId,
          email: userEmail,
          createdAt: new Date().toISOString(),
          network: 'ethereum-mainnet',
          balance: '0'
        };

        console.log(`💼 Wallet Address: ${walletData.address}`);
        console.log(`🔐 Private Key: ${privateKey.substring(0, 10)}...`);
        console.log(`📝 Derivation Path: ${derivationPath}`);

      } catch (ethersError) {
        console.log('⚠️ Ethers unavailable, generating simple deterministic address');
        // Fallback: generate address from hash
        const addressHash = crypto.createHash('sha256').update(seedString + '-address').digest('hex');
        const address = '0x' + addressHash.substring(0, 40);
        
        walletData = {
          address: address,
          privateKey: null, // Don't store private key in fallback mode
          mnemonic: null,
          derivationPath: null,
          userId: userId,
          email: userEmail,
          createdAt: new Date().toISOString(),
          network: 'safetourai-testnet',
          balance: '0'
        };
        
        console.log(`💼 Fallback Address: ${walletData.address}`);
      }

      // Cache wallet for session
      this.walletCache.set(userId, walletData);

      // Get initial balance
      await this.updateWalletBalance(walletData);

      console.log(`✅ Deterministic wallet generated successfully`);
      return walletData;

    } catch (error) {
      console.error('❌ Failed to generate deterministic wallet:', error);
      throw error;
    }
  }

  /**
   * Recover wallet from user credentials (auto-recovery like Telegram)
   * @param {string} userEmail - User's email
   * @param {string} userId - User's Firebase UID
   * @returns {object} - Recovered wallet data
   */
  async recoverWallet(userEmail, userId) {
    try {
      console.log(`\n🔄 ========== WALLET RECOVERY ==========`);
      console.log(`📧 Recovering wallet for: ${userEmail}`);

      // Check cache first
      if (this.walletCache.has(userId)) {
        console.log(`💾 Wallet found in cache`);
        const cachedWallet = this.walletCache.get(userId);
        await this.updateWalletBalance(cachedWallet);
        return cachedWallet;
      }

      // Generate the same deterministic wallet
      const recoveredWallet = await this.generateDeterministicWallet(userEmail, userId);
      
      console.log(`✅ Wallet recovered successfully: ${recoveredWallet.address}`);
      return recoveredWallet;

    } catch (error) {
      console.error('❌ Failed to recover wallet:', error);
      throw error;
    }
  }

  /**
   * Update wallet balance
   * @param {object} walletData - Wallet data object
   */
  async updateWalletBalance(walletData) {
    try {
      if (!this.web3) {
        console.log('⚠️ Web3 not initialized, using mock balance');
        walletData.balance = '0.001';
        walletData.balanceWei = '1000000000000000';
        walletData.lastUpdated = new Date().toISOString();
        return;
      }

      const balance = await this.web3.eth.getBalance(walletData.address);
      const balanceInEth = this.web3.utils.fromWei(balance, 'ether');
      
      walletData.balance = balanceInEth;
      walletData.balanceWei = balance;
      walletData.lastUpdated = new Date().toISOString();

      console.log(`💰 Balance updated: ${balanceInEth} ETH`);
      
    } catch (error) {
      console.error('❌ Failed to update balance:', error);
      // Use mock balance for development
      walletData.balance = '0.001';
      walletData.balanceWei = '1000000000000000';
      walletData.lastUpdated = new Date().toISOString();
    }
  }

  /**
   * Get wallet by user ID
   * @param {string} userId - User's Firebase UID
   * @returns {object|null} - Wallet data or null
   */
  getWallet(userId) {
    return this.walletCache.get(userId) || null;
  }

  /**
   * Send transaction
   * @param {string} userId - User ID
   * @param {string} toAddress - Recipient address
   * @param {string} amount - Amount in ETH
   * @returns {object} - Transaction result
   */
  async sendTransaction(userId, toAddress, amount) {
    try {
      const walletData = this.walletCache.get(userId);
      if (!walletData) {
        throw new Error('Wallet not found. Please recover wallet first.');
      }

      const wallet = new ethers.Wallet(walletData.privateKey, this.provider);
      
      // Convert amount to Wei
      const amountWei = ethers.parseEther(amount);
      
      // Get gas price and estimate gas
      const gasPrice = await this.provider.getFeeData();
      const gasLimit = await wallet.estimateGas({
        to: toAddress,
        value: amountWei
      });

      // Create transaction
      const transaction = {
        to: toAddress,
        value: amountWei,
        gasLimit: gasLimit,
        gasPrice: gasPrice.gasPrice
      };

      // Send transaction
      const txResponse = await wallet.sendTransaction(transaction);
      
      console.log(`📤 Transaction sent: ${txResponse.hash}`);
      
      return {
        success: true,
        transactionHash: txResponse.hash,
        from: walletData.address,
        to: toAddress,
        amount: amount,
        gasUsed: gasLimit.toString(),
        gasPrice: gasPrice.gasPrice.toString()
      };

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   * @param {string} userId - User ID
   * @returns {array} - Transaction history
   */
  async getTransactionHistory(userId) {
    try {
      const walletData = this.walletCache.get(userId);
      if (!walletData) {
        return [];
      }

      if (!this.web3) {
        // Return mock transactions for development
        return [
          {
            hash: '0x1234567890abcdef',
            from: '0x742d35Cc6634C0532925a3b8D404fddF4f0c1234',
            to: walletData.address,
            value: '1000000000000000',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            blockNumber: 18500000
          }
        ];
      }

      // Note: For full transaction history, you'd need to use Etherscan API
      // This is a basic implementation
      const latestBlock = await this.web3.eth.getBlockNumber();
      const transactions = [];

      // Get recent transactions (last 10 blocks)
      for (let i = 0; i < 10; i++) {
        try {
          const block = await this.web3.eth.getBlock(latestBlock - i, true);
          if (block && block.transactions) {
            const userTxs = block.transactions.filter(tx => 
              tx.from === walletData.address || tx.to === walletData.address
            );
            transactions.push(...userTxs);
          }
        } catch (blockError) {
          // Skip block if error
          continue;
        }
      }

      return transactions;

    } catch (error) {
      console.error('❌ Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Encrypt sensitive data for storage
   * @param {string} data - Data to encrypt
   * @param {string} userId - User ID for encryption key
   * @returns {string} - Encrypted data
   */
  encryptSensitiveData(data, userId) {
    const encryptionKey = crypto.createHash('sha256').update(`${userId}-${process.env.WALLET_SECRET}`).digest('hex');
    return CryptoJS.AES.encrypt(data, encryptionKey).toString();
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Encrypted data
   * @param {string} userId - User ID for decryption key
   * @returns {string} - Decrypted data
   */
  decryptSensitiveData(encryptedData, userId) {
    const encryptionKey = crypto.createHash('sha256').update(`${userId}-${process.env.WALLET_SECRET}`).digest('hex');
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Generate real blockchain ID from wallet address
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {string} - Real blockchain ID
   */
  generateRealBlockchainId(walletAddress) {
    // Use the actual Ethereum address as blockchain ID
    return walletAddress;
  }
}

module.exports = new WalletService();
