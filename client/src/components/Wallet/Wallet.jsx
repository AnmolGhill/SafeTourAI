import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign as FiWallet, 
  FiSend, 
  FiDownload, 
  FiRefreshCw, 
  FiCopy, 
  FiEye, 
  FiEyeOff,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiShield,
  FiKey,
  FiAlertTriangle
} from 'react-icons/fi';
import { walletAPI } from '../../config/api';

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initializeWallet();
    fetchTransactions();
  }, []);

  const initializeWallet = async () => {
    try {
      setLoading(true);
      
      const response = await walletAPI.createWallet();
      if (response.data && response.data.success) {
        setWallet(response.data.wallet);
        setBalance(response.data.wallet.balance);
      }
    } catch (error) {
      console.error('Error initializing wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await walletAPI.getTransactions();
      if (response.data && response.data.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const refreshBalance = async () => {
    try {
      const response = await walletAPI.refreshBalance();
      if (response.data && response.data.success) {
        setBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  const fetchSeedPhrase = async () => {
    try {
      const response = await walletAPI.getSeedPhrase();
      if (response.data && response.data.success) {
        setSeedPhrase(response.data.seedPhrase);
      }
    } catch (error) {
      console.error('Error fetching seed phrase:', error);
    }
  };

  const sendTransaction = async () => {
    try {
      setSendLoading(true);
      
      const response = await walletAPI.sendTransaction(sendAddress, sendAmount);
      if (response.data && response.data.success) {
        alert(`Transaction sent! Hash: ${response.data.transaction.transactionHash}`);
        setSendAmount('');
        setSendAddress('');
        setShowSendModal(false);
        refreshBalance();
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setSendLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(6);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Initializing your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">SafeTour Wallet</h1>
              <p className="text-blue-100">Your secure Ethereum wallet</p>
            </div>
            <FiWallet className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Wallet Balance</h2>
              <button
                onClick={refreshBalance}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center py-8">
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {formatBalance(balance)} ETH
              </div>
              <div className="text-gray-600 mb-6">
                ≈ ${(parseFloat(balance) * 2000).toFixed(2)} USD
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiSend className="w-4 h-4" />
                  <span>Send</span>
                </button>
                <button
                  onClick={() => {
                    if (!showSeedPhrase) fetchSeedPhrase();
                    setShowSeedPhrase(!showSeedPhrase);
                  }}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <FiKey className="w-4 h-4" />
                  <span>Seed Phrase</span>
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Wallet Info</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Address</label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-sm text-gray-800">
                    {formatAddress(wallet?.address)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(wallet?.address)}
                    className="p-1 text-gray-600 hover:text-blue-600"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Network</label>
                <div className="text-sm text-gray-800 mt-1">Ethereum Mainnet</div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Created</label>
                <div className="text-sm text-gray-800 mt-1">
                  {wallet?.createdAt ? new Date(wallet.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seed Phrase Section */}
        {showSeedPhrase && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FiAlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800">Recovery Seed Phrase</h3>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-orange-800 text-sm">
                <strong>Warning:</strong> Keep your seed phrase secure and never share it with anyone. 
                Anyone with access to your seed phrase can control your wallet.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-3 gap-2">
                {seedPhrase.split(' ').map((word, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-center">
                    <span className="text-xs text-gray-500">{index + 1}</span>
                    <div className="font-mono text-sm">{word}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => copyToClipboard(seedPhrase)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FiCopy className="w-4 h-4" />
              <span>{copied ? 'Copied!' : 'Copy Seed Phrase'}</span>
            </button>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiWallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      {tx.from === wallet?.address ? (
                        <FiArrowUpRight className="w-4 h-4 text-red-600" />
                      ) : (
                        <FiArrowDownLeft className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {tx.from === wallet?.address ? 'Sent' : 'Received'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {tx.from === wallet?.address ? `To: ${formatAddress(tx.to)}` : `From: ${formatAddress(tx.from)}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${tx.from === wallet?.address ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.from === wallet?.address ? '-' : '+'}{tx.amount} ETH
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Ethereum</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={sendAddress}
                    onChange={(e) => setSendAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.001"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    Available: {formatBalance(balance)} ETH
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendTransaction}
                  disabled={sendLoading || !sendAddress || !sendAmount}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
