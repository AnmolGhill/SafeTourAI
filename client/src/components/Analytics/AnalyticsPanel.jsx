import React, { useState, useEffect } from 'react';
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiUsers, 
  FiAlertTriangle,
  FiShield,
  FiMapPin,
  FiClock,
  FiActivity
} from 'react-icons/fi';

const AnalyticsPanel = () => {
  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };
  
  const user = getCurrentUser();
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeEmergencies: 0,
    resolvedEmergencies: 0,
    responseTime: 0,
    kycVerified: 0,
    monthlyGrowth: 0
  });
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data for demo
      setTimeout(() => {
        setAnalytics({
          totalUsers: 1247,
          activeEmergencies: 3,
          resolvedEmergencies: 89,
          responseTime: 4.2,
          kycVerified: 892,
          monthlyGrowth: 12.5
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const ChartPlaceholder = ({ title, height = "300px" }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div 
        className="bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <FiBarChart2 className="w-12 h-12 mx-auto mb-2" />
          <p>Chart visualization would appear here</p>
          <p className="text-sm">Integration with Chart.js or similar library needed</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiBarChart2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={FiUsers}
          title="Total Users"
          value={analytics.totalUsers.toLocaleString()}
          subtitle={`+${analytics.monthlyGrowth}% this month`}
          color="blue"
        />
        <StatCard
          icon={FiAlertTriangle}
          title="Active Emergencies"
          value={analytics.activeEmergencies}
          subtitle="Requires immediate attention"
          color="red"
        />
        <StatCard
          icon={FiShield}
          title="Resolved Emergencies"
          value={analytics.resolvedEmergencies}
          subtitle="Successfully handled"
          color="green"
        />
        <StatCard
          icon={FiClock}
          title="Avg Response Time"
          value={`${analytics.responseTime} min`}
          subtitle="Emergency response average"
          color="yellow"
        />
        <StatCard
          icon={FiActivity}
          title="KYC Verified"
          value={analytics.kycVerified.toLocaleString()}
          subtitle={`${((analytics.kycVerified / analytics.totalUsers) * 100).toFixed(1)}% of users`}
          color="purple"
        />
        <StatCard
          icon={FiTrendingUp}
          title="Growth Rate"
          value={`+${analytics.monthlyGrowth}%`}
          subtitle="Monthly user growth"
          color="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder title="Emergency Response Trends" />
        <ChartPlaceholder title="User Registration Growth" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartPlaceholder title="Geographic Distribution of Emergencies" height="400px" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { type: 'emergency', message: 'Medical emergency reported in Downtown', time: '2 min ago', icon: FiAlertTriangle, color: 'red' },
            { type: 'user', message: 'New user registration: Sarah Johnson', time: '5 min ago', icon: FiUsers, color: 'blue' },
            { type: 'kyc', message: 'KYC verification completed for Mike Chen', time: '12 min ago', icon: FiShield, color: 'green' },
            { type: 'emergency', message: 'Traffic accident resolved on Main St', time: '18 min ago', icon: FiMapPin, color: 'green' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full bg-${activity.color}-100`}>
                <activity.icon className={`w-4 h-4 text-${activity.color}-600`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
