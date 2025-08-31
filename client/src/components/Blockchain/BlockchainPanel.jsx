import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import blockchainService from '../../services/blockchainService';
import { 
  CubeIcon, 
  LinkIcon, 
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const BlockchainPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadStatistics();
    checkWalletConnection();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await blockchainService.getTransactions({ limit: 20 });
      setTransactions(data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await blockchainService.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load blockchain statistics');
    }
  };

  const checkWalletConnection = async () => {
    try {
      const networkInfo = await blockchainService.getNetworkInfo();
      setWalletInfo(networkInfo);
      setWalletConnected(networkInfo.isConnected);
    } catch (error) {
      console.error('Failed to check wallet connection');
    }
  };

  const handleConnectWallet = async () => {
    try {
      const result = await blockchainService.connectWallet();
      if (result.success) {
        setWalletConnected(true);
        toast.success('Wallet connected successfully');
        checkWalletConnection();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Wallet Connection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CubeIcon className="h-8 w-8 text-purple-500 mr-3" />
            Blockchain Records
          </h2>
          
          {!walletConnected ? (
            <button
              onClick={handleConnectWallet}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-200"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Wallet Connected</span>
            </div>
          )}
        </div>

        {/* Wallet Info */}
        {walletInfo && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Network ID</h3>
              <p className="text-lg font-bold text-purple-600">{walletInfo.networkId}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Block Number</h3>
              <p className="text-lg font-bold text-blue-600">{walletInfo.blockNumber}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Account</h3>
              <p className="text-sm font-mono text-green-600">
                {walletInfo.account ? truncateHash(walletInfo.account) : 'Not Connected'}
              </p>
            </div>
          </div>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">Total Transactions</h3>
              <p className="text-2xl font-bold text-gray-600">{statistics.total || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Confirmed</h3>
              <p className="text-2xl font-bold text-green-600">{statistics.confirmed || 0}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600">{statistics.pending || 0}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-900">Failed</h3>
              <p className="text-2xl font-bold text-red-600">{statistics.failed || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CubeIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No blockchain transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Transaction ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Hash</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.transactionId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-blue-600">
                        {transaction.transactionId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {transaction.transactionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <LinkIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm text-gray-600">
                          {truncateHash(transaction.blockchainHash)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-sm capitalize">{transaction.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainPanel;
