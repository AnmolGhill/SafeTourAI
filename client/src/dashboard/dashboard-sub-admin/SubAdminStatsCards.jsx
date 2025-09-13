import React, { useState, useEffect } from 'react';
import { FiUsers, FiAlertTriangle, FiCheckCircle, FiEye } from 'react-icons/fi';

const SubAdminStatsCards = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubAdminStats();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchSubAdminStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSubAdminStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/admin/subadmin-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sub-admin statistics');
      }

      const data = await response.json();
      
      // Transform API data to stats format
      const transformedStats = [
        {
          title: 'Tourists Verified Today',
          value: data.touristsVerifiedToday.count.toString(),
          change: data.touristsVerifiedToday.change,
          changeType: 'positive',
          icon: FiUsers,
          iconBg: 'bg-blue-500',
          realTime: data.realTimeData
        },
        {
          title: 'Active Incidents',
          value: data.activeIncidents.count.toString(),
          change: data.activeIncidents.change,
          changeType: data.activeIncidents.count === 0 ? 'positive' : 'warning',
          icon: FiAlertTriangle,
          iconBg: data.activeIncidents.count === 0 ? 'bg-green-500' : 'bg-red-500',
          realTime: data.realTimeData
        },
        {
          title: 'ID Scans Completed',
          value: data.idScansCompleted.count.toString(),
          change: data.idScansCompleted.change,
          changeType: 'positive',
          icon: FiCheckCircle,
          iconBg: 'bg-green-500',
          realTime: data.realTimeData
        },
        {
          title: 'Profiles Accessed',
          value: data.profilesAccessed.count.toString(),
          change: data.profilesAccessed.change,
          changeType: 'positive',
          icon: FiEye,
          iconBg: 'bg-yellow-500',
          realTime: data.realTimeData
        }
      ];

      setStats(transformedStats);
      setLoading(false);
      setError(null);

    } catch (err) {
      console.error('Error fetching sub-admin stats:', err);
      setError(err.message);
      setLoading(false);
      
      // Fallback to empty data if API fails
      setStats([
        {
          title: 'Tourists Verified Today',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiUsers,
          iconBg: 'bg-gray-400'
        },
        {
          title: 'Active Incidents',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiAlertTriangle,
          iconBg: 'bg-gray-400'
        },
        {
          title: 'ID Scans Completed',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiCheckCircle,
          iconBg: 'bg-gray-400'
        },
        {
          title: 'Profiles Accessed',
          value: '0',
          change: 'No data available',
          changeType: 'neutral',
          icon: FiEye,
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

export default SubAdminStatsCards;
