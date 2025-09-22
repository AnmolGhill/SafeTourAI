import React, { useState, useEffect } from 'react';
import { FiUsers, FiShield, FiDatabase, FiActivity, FiUserCheck, FiClock, FiCheckCircle } from 'react-icons/fi';
import { adminAPI } from '../../config/api';

const AdminStatsCards = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Fetch only KYC stats
      const kycStatsResponse = await adminAPI.getKYCStats();
      const kycData = kycStatsResponse.data;

      // Transform API data to stats format - only KYC stats
      const transformedStats = [
        // KYC stats cards (4 cards as requested)
        {
          title: 'Total Users',
          value: (kycData?.total || 0).toString(),
          change: 'Total registered users',
          changeType: 'neutral',
          icon: FiUsers,
          iconBg: 'bg-blue-500',
          realTime: false
        },
        {
          title: 'Pending Review',
          value: (kycData?.submitted || 0).toString(),
          change: 'Awaiting verification',
          changeType: 'warning',
          icon: FiClock,
          iconBg: 'bg-yellow-500',
          realTime: false
        },
        {
          title: 'Verified',
          value: (kycData?.approved || 0).toString(),
          change: 'Successfully verified',
          changeType: 'positive',
          icon: FiCheckCircle,
          iconBg: 'bg-green-600',
          realTime: false
        },
        {
          title: 'Blockchain IDs',
          value: (kycData?.approved || 0).toString(),
          change: 'Generated blockchain IDs',
          changeType: 'positive',
          icon: FiUserCheck,
          iconBg: 'bg-indigo-500',
          realTime: false
        }
      ];

      setStats(transformedStats);
      setLoading(false);
      setError(null);

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
      setLoading(false);
      
      // Fallback to KYC data only if dashboard API fails
      setStats([
        {
          title: 'Total Users',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiUsers,
          iconBg: 'bg-gray-400'
        },
        {
          title: 'Pending Review',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiClock,
          iconBg: 'bg-gray-400'
        },
        {
          title: 'Verified',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiCheckCircle,
          iconBg: 'bg-gray-400'
        },
        {
          title: 'Blockchain IDs',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiUserCheck,
          iconBg: 'bg-gray-400'
        }
      ]);
    }
  };

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="stat-card animate-pulse">
            <div className="stat-header">
              <div>
                <div className="stat-title bg-gray-200 h-4 w-32 rounded mb-2"></div>
                <div className="stat-value bg-gray-200 h-8 w-20 rounded"></div>
              </div>
              <div className="stat-icon bg-gray-200 w-12 h-12 rounded-lg"></div>
            </div>
            <div className="stat-change">
              <div className="bg-gray-200 h-4 w-24 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {error && (
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 text-sm">⚠️ {error}</p>
        </div>
      )}
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-title flex items-center gap-2">
                {stat.title}
                {stat.realTime && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
              <div className="stat-value">{stat.value}</div>
            </div>
            <div className={`stat-icon ${stat.iconBg}`}>
              <stat.icon className="text-white" />
            </div>
          </div>
          <div className={`stat-change ${stat.changeType}`}>
            <span>{stat.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStatsCards;
