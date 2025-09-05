import React, { useState, useEffect } from 'react';
import { 
  FiLink, 
  FiCheckCircle, 
  FiClock, 
  FiExternalLink,
  FiCopy,
  FiRefreshCw,
  FiUser,
  FiShield
} from 'react-icons/fi';
import { kycAPI } from '../../config/api';

const BlockchainPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [blockchainId, setBlockchainId] = useState(null);

  // Mock blockchain transaction data
  const mockTransactions = [
    {
      id: 'TXN_001234_ABC123',
      userId: 'USR_567890_DEF456',
      eventType: 'Emergency Created',
      status: 'verified',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      blockHash: '0x1a2b3c4d5e6f7890abcdef1234567890',
      blockNumber: 12345
    },
    {
      id: 'TXN_001235_ABC124',
      userId: 'USR_567891_DEF457',
      eventType: 'Location Updated',
      status: 'verified',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      blockHash: '0x2b3c4d5e6f7890abcdef1234567890ab',
      blockNumber: 12344
    },
    {
      id: 'TXN_001236_ABC125',
      userId: 'USR_567892_DEF458',
      eventType: 'Alert Sent',
      status: 'pending',
      timestamp: new Date(Date.now() - 40 * 60 * 1000),
      blockHash: '0x3c4d5e6f7890abcdef1234567890abcd',
      blockNumber: 12343
    },
    {
      id: 'TXN_001237_ABC126',
      userId: 'USR_567893_DEF459',
      eventType: 'Safe Check-in',
      status: 'verified',
      timestamp: new Date(Date.now() - 55 * 60 * 1000),
      blockHash: '0x4d5e6f7890abcdef1234567890abcdef',
      blockNumber: 12342
    },
    {
      id: 'TXN_001238_ABC127',
      userId: 'USR_567894_DEF460',
      eventType: 'Emergency Resolved',
      status: 'verified',
      timestamp: new Date(Date.now() - 70 * 60 * 1000),
      blockHash: '0x5e6f7890abcdef1234567890abcdef12',
      blockNumber: 12341
    }
  ];

  useEffect(() => {
    setTransactions(mockTransactions);
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await kycAPI.getStatus();
      if (response.data.success) {
        setKycStatus(response.data.data.kycStatus);
        setBlockchainId(response.data.data.blockchainId);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const refreshTransactions = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTransactions([...mockTransactions]);
      setLoading(false);
    }, 1000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log('Copied to clipboard:', text);
  };

  const shortenHash = (hash) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  const shortenId = (id) => {
    return `${id.substring(0, 12)}...`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return FiCheckCircle;
      case 'pending':
        return FiClock;
      default:
        return FiClock;
    }
  };

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiLink className="text-blue-600 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Blockchain Verification</h2>
                <p className="text-sm text-gray-600">Your digital identity and blockchain transactions</p>
              </div>
            </div>
            
            <button
              onClick={refreshTransactions}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                       text-white rounded-lg transition-colors duration-200 text-sm font-medium 
                       disabled:opacity-50"
            >
              <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Blockchain ID Section */}
        {kycStatus === 'approved' && blockchainId && (
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiShield className="text-green-600 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <span>Your Blockchain ID</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ KYC Verified
                  </span>
                </h3>
                <div className="flex items-center space-x-3 mt-2">
                  <code className="text-sm font-mono bg-white px-3 py-2 rounded border text-gray-800">
                    {blockchainId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(blockchainId)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <FiCopy />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This is your unique Ethereum wallet address generated after KYC approval. Use it for secure transactions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KYC Status for non-approved users */}
        {kycStatus !== 'approved' && (
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiUser className="text-yellow-600 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <span>Blockchain ID Status</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    kycStatus === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                    kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {kycStatus === 'submitted' ? '⏳ Under Review' :
                     kycStatus === 'rejected' ? '❌ Rejected' :
                     '📋 KYC Required'}
                  </span>
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {kycStatus === 'submitted' ? 
                    'Your KYC is under review. Blockchain ID will be generated after approval.' :
                    kycStatus === 'rejected' ?
                    'Your KYC was rejected. Please resubmit with correct documents.' :
                    'Complete KYC verification to get your unique blockchain ID and wallet access.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="divide-y divide-gray-100">
          {transactions.map((transaction) => {
            const StatusIcon = getStatusIcon(transaction.status);
            
            return (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(transaction.status)}`}>
                      <StatusIcon className="text-lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{transaction.eventType}</h4>
                      <p className="text-sm text-gray-600">Block #{transaction.blockNumber}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${getStatusColor(transaction.status)}
                    `}>
                      {transaction.status === 'verified' ? '✅ Verified' : '❌ Pending'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {transaction.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-500 text-xs uppercase tracking-wide">Transaction ID</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-gray-800 font-mono">{shortenId(transaction.id)}</code>
                      <button
                        onClick={() => copyToClipboard(transaction.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiCopy className="text-sm" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-gray-500 text-xs uppercase tracking-wide">User ID</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-gray-800 font-mono">{shortenId(transaction.userId)}</code>
                      <button
                        onClick={() => copyToClipboard(transaction.userId)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiCopy className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-gray-500 text-xs uppercase tracking-wide">Block Hash</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="text-gray-800 font-mono text-sm">{shortenHash(transaction.blockHash)}</code>
                    <button
                      onClick={() => copyToClipboard(transaction.blockHash)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiCopy className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Blockchain synchronized</span>
              <span>•</span>
              <span>{transactions.length} recent transactions</span>
            </div>
            
            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 
                             text-sm font-medium transition-colors duration-200">
              <span>View More on Blockchain Explorer</span>
              <FiExternalLink />
            </button>
          </div>
        </div>
      </div>

      {/* Blockchain Stats */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm text-gray-600">Network Status</p>
              <p className="font-semibold text-green-600">Active</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-3">
            <FiLink className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="font-semibold text-gray-800">1,234</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-3">
            <FiCheckCircle className="text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Verified Today</p>
              <p className="font-semibold text-gray-800">47</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainPanel;
