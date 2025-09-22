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
import { kycAPI, blockchainAPI, walletAPI } from '../../config/api';

const BlockchainPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [blockchainId, setBlockchainId] = useState(null);
  const [blockchainStats, setBlockchainStats] = useState({
    networkStatus: 'active',
    totalRecords: 0,
    verifiedToday: 0
  });

  // Fetch real blockchain transactions from API
  const fetchBlockchainTransactions = async () => {
    setLoading(true);
    try {
      const result = await walletAPI.getTransactions();
      if (result.data) {
        setTransactions(result.data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching blockchain transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real blockchain statistics
  const fetchBlockchainStats = async () => {
    try {
      // For now, set basic stats - you can expand this when backend provides stats endpoint
      setBlockchainStats({
        networkStatus: 'active',
        totalRecords: transactions.length,
        verifiedToday: transactions.filter(tx => {
          const today = new Date().toDateString();
          return new Date(tx.timestamp).toDateString() === today;
        }).length
      });
    } catch (error) {
      console.error('Error calculating blockchain stats:', error);
      setBlockchainStats({
        networkStatus: 'active',
        totalRecords: 0,
        verifiedToday: 0
      });
    }
  };

  useEffect(() => {
    fetchBlockchainTransactions();
    fetchBlockchainStats();
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
      setKycStatus('not_started');
      setBlockchainId(null);
    }
  };

  const refreshTransactions = async () => {
    await fetchBlockchainTransactions();
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
    <div className="blockchain-panel mb-6" style={{ minHeight: '400px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Blockchain Verification</h2>
        <button
          onClick={refreshTransactions}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* KYC Approved Section */}
        {kycStatus === 'approved' && blockchainId && (
        <div className="p-6 border-b border-gray-200">
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
          {loading ? (
          // Loading skeleton for transactions
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mt-2"></div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          // Empty state
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FiLink className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Blockchain Transactions</h3>
            <p className="text-gray-600 mb-4">
              No blockchain transactions found for your account. Complete KYC verification to start recording transactions.
            </p>
            <button
              onClick={refreshTransactions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Transactions
            </button>
          </div>
        ) : (
          transactions.map((transaction) => {
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
                      {new Date(transaction.timestamp).toLocaleTimeString()}
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
          })
        )}
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
            <div className={`w-3 h-3 rounded-full ${blockchainStats.networkStatus === 'active' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <div>
              <p className="text-sm text-gray-600">Network Status</p>
              <p className={`font-semibold ${blockchainStats.networkStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {blockchainStats.networkStatus === 'active' ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-3">
            <FiLink className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="font-semibold text-gray-800">{blockchainStats.totalRecords}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-3">
            <FiCheckCircle className="text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Verified Today</p>
              <p className="font-semibold text-gray-800">{blockchainStats.verifiedToday}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default BlockchainPanel;
