import Web3 from 'web3';
import { blockchainAPI } from '../config/api';

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.account = null;
    this.isConnected = false;
    this.initializeWeb3();
  }

  // Initialize Web3 connection
  async initializeWeb3() {
    try {
      if (window.ethereum) {
        this.web3 = new Web3(window.ethereum);
      } else {
        // Fallback to backend blockchain service
        this.web3 = new Web3('http://localhost:8545');
      }
    } catch (error) {
      console.error('Error initializing Web3:', error);
    }
  }

  // Connect to MetaMask wallet
  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.account = accounts[0];
      this.isConnected = true;

      return {
        success: true,
        account: this.account
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Create blockchain wallet for user
  async createWallet(userId) {
    try {
      const response = await blockchainAPI.createWallet(userId);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get user's blockchain wallet
  async getWallet(userId) {
    try {
      const response = await blockchainAPI.getWallet(userId);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Record transaction on blockchain
  async recordTransaction(transactionData) {
    try {
      const response = await blockchainAPI.recordTransaction(transactionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get all transactions
  async getTransactions(params = {}) {
    try {
      const response = await blockchainAPI.getTransactions(params);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get transaction by ID
  async getTransaction(id) {
    try {
      const response = await blockchainAPI.getTransaction(id);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Verify transaction
  async verifyTransaction(hash) {
    try {
      const response = await blockchainAPI.verifyTransaction(hash);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get blockchain statistics
  async getStatistics() {
    try {
      const response = await blockchainAPI.getStatistics();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get account balance (if connected to MetaMask)
  async getBalance() {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error('Wallet not connected');
      }

      const balance = await this.web3.eth.getBalance(this.account);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Sign message with MetaMask
  async signMessage(message) {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error('Wallet not connected');
      }

      const signature = await this.web3.eth.personal.sign(message, this.account);
      return signature;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get network info
  async getNetworkInfo() {
    try {
      if (!this.web3) {
        throw new Error('Web3 not initialized');
      }

      const networkId = await this.web3.eth.net.getId();
      const blockNumber = await this.web3.eth.getBlockNumber();
      
      return {
        networkId,
        blockNumber,
        isConnected: this.isConnected,
        account: this.account
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Check if wallet is connected
  isWalletConnected() {
    return this.isConnected && !!this.account;
  }

  // Get connected account
  getConnectedAccount() {
    return this.account;
  }
}

export default new BlockchainService();
