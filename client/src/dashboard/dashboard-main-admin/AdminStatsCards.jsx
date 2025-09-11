import React, { useState, useEffect } from 'react';
import { FiUsers, FiShield, FiDatabase, FiActivity } from 'react-icons/fi';

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
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/admin/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const data = await response.json();
      
      // Transform API data to stats format
      const transformedStats = [
        {
          title: 'Verified Blockchain Users',
          value: data.verifiedBlockchainUsers.count.toString(),
          change: data.verifiedBlockchainUsers.change + ' ' + data.verifiedBlockchainUsers.status.toLowerCase(),
          changeType: 'positive',
          icon: FiUsers,
          iconBg: 'bg-blue-500',
          realTime: data.verifiedBlockchainUsers.liveUpdates
        },
        {
          title: 'Active User Sessions',
          value: data.activeUserSessions.count.toString(),
          change: data.activeUserSessions.change + ' ' + data.activeUserSessions.status.toLowerCase(),
          changeType: 'positive',
          icon: FiShield,
          iconBg: 'bg-green-500',
          realTime: data.activeUserSessions.liveUpdates
        },
        {
          title: 'Blockchain Transactions',
          value: data.blockchainTransactions.count.toString(),
          change: data.blockchainTransactions.change + ' ' + data.blockchainTransactions.status.toLowerCase(),
          changeType: 'positive',
          icon: FiDatabase,
          iconBg: 'bg-purple-500',
          realTime: data.blockchainTransactions.liveUpdates
        },
        {
          title: 'Security Score',
          value: data.securityScore.percentage + '%',
          change: data.securityScore.change + ' ' + data.securityScore.status.toLowerCase(),
          changeType: 'positive',
          icon: FiActivity,
          iconBg: 'bg-teal-500',
          realTime: data.securityScore.liveUpdates
        }
      ];

      setStats(transformedStats);
      setLoading(false);
      setError(null);

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
      setLoading(false);
      
      // Fallback to empty data if API fails
      setStats([
        {
          title: 'Verified Blockchain Users',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiUsers,
          iconBg: 'bg-gray-400'
        },
        {
          title: 'Active User Sessions',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiShield,
          iconBg: 'bg-gray-400'
        },
        {
          title: 'Blockchain Transactions',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiDatabase,
          iconBg: 'bg-gray-400'
        },
        {
          title: 'Security Score',
          value: '0%',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiActivity,
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
