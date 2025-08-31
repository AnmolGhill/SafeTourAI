import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { emergencyAPI, blockchainAPI, kycAPI } from '../../config/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AnalyticsPanel = () => {
  const [emergencyStats, setEmergencyStats] = useState(null);
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [kycStats, setKycStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const [emergencyData, blockchainData, kycData] = await Promise.all([
        emergencyAPI.getStatistics({ startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
        blockchainAPI.getStatistics(),
        kycAPI.getStatistics()
      ]);

      setEmergencyStats(emergencyData.data);
      setBlockchainStats(blockchainData.data);
      setKycStats(kycData.data);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (stats) => {
    if (!stats) return [];
    
    return Object.entries(stats.byType || {}).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-500 mr-3" />
            Analytics Dashboard
          </h2>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Total Emergencies</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {emergencyStats?.total || 0}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">Resolved</h3>
                <p className="text-2xl font-bold text-green-600">
                  {emergencyStats?.resolved || 0}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-900">Blockchain Txns</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {blockchainStats?.total || 0}
                </p>
              </div>
              <CubeIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-900">KYC Verified</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {kycStats?.verified || 0}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Emergency Types Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Emergency Types Distribution</h3>
          {emergencyStats ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatChartData(emergencyStats)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatChartData(emergencyStats).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Response Time Trends */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Response Time Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { name: 'Mon', responseTime: 4.2 },
              { name: 'Tue', responseTime: 3.8 },
              { name: 'Wed', responseTime: 4.5 },
              { name: 'Thu', responseTime: 3.9 },
              { name: 'Fri', responseTime: 4.1 },
              { name: 'Sat', responseTime: 3.7 },
              { name: 'Sun', responseTime: 4.0 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} min`, 'Response Time']} />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Emergency Status Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Emergency Status</h3>
          {emergencyStats ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active</span>
                <span className="font-semibold text-red-600">{emergencyStats.active || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Responded</span>
                <span className="font-semibold text-yellow-600">{emergencyStats.responded || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Resolved</span>
                <span className="font-semibold text-green-600">{emergencyStats.resolved || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cancelled</span>
                <span className="font-semibold text-gray-600">{emergencyStats.cancelled || 0}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        {/* Blockchain Transaction Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Blockchain Status</h3>
          {blockchainStats ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confirmed</span>
                <span className="font-semibold text-green-600">{blockchainStats.confirmed || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{blockchainStats.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Failed</span>
                <span className="font-semibold text-red-600">{blockchainStats.failed || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Fees</span>
                <span className="font-semibold text-blue-600">{blockchainStats.totalNetworkFees || 0} ETH</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        {/* KYC Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">KYC Verification</h3>
          {kycStats ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Verified</span>
                <span className="font-semibold text-green-600">{kycStats.verified || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{kycStats.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rejected</span>
                <span className="font-semibold text-red-600">{kycStats.rejected || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Verification Rate</span>
                <span className="font-semibold text-blue-600">
                  {kycStats.total ? ((kycStats.verified / kycStats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
