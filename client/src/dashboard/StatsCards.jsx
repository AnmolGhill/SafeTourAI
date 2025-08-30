import React, { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiBell, 
  FiLink,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiShield,
  FiHash,
  FiActivity
} from 'react-icons/fi';

const StatsCards = () => {
  const [stats, setStats] = useState({
    activeEmergencies: 3,
    safeCheckins: 247,
    alertsSent: 18,
    blockchainRecords: 1234,
    verifiedUsers: 892,
    activeUserSessions: 156,
    blockchainTransactions: 3247,
    securityScore: 98.5
  });

  const [loading, setLoading] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        safeCheckins: prev.safeCheckins + Math.floor(Math.random() * 3),
        blockchainRecords: prev.blockchainRecords + Math.floor(Math.random() * 2),
        activeUserSessions: Math.max(100, prev.activeUserSessions + Math.floor(Math.random() * 10) - 5),
        blockchainTransactions: prev.blockchainTransactions + Math.floor(Math.random() * 5)
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const cardData = [
    {
      title: 'Verified Blockchain Users',
      value: stats.verifiedUsers.toLocaleString(),
      icon: FiUsers,
      color: 'blue',
      bgColor: 'stat-card',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
      trend: '+23',
      trendUp: true,
      subtitle: 'Identity Verified'
    },
    {
      title: 'Active User Sessions',
      value: stats.activeUserSessions,
      icon: FiActivity,
      color: 'green',
      bgColor: 'stat-card',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
      trend: '+8',
      trendUp: true,
      subtitle: 'Currently Online'
    },
    {
      title: 'Blockchain Transactions',
      value: stats.blockchainTransactions.toLocaleString(),
      icon: FiHash,
      color: 'purple',
      bgColor: 'stat-card',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-700',
      trend: '+47',
      trendUp: true,
      subtitle: 'Total Records'
    },
    {
      title: 'Security Score',
      value: `${stats.securityScore}%`,
      icon: FiShield,
      color: 'emerald',
      bgColor: 'stat-card',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-700',
      trend: '+0.3',
      trendUp: true,
      subtitle: 'System Security'
    }
  ];

  const refreshStats = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStats(prev => ({
        activeEmergencies: Math.floor(Math.random() * 10),
        safeCheckins: prev.safeCheckins + Math.floor(Math.random() * 20),
        alertsSent: prev.alertsSent + Math.floor(Math.random() * 5),
        blockchainRecords: prev.blockchainRecords + Math.floor(Math.random() * 10),
        verifiedUsers: prev.verifiedUsers + Math.floor(Math.random() * 15),
        activeUserSessions: Math.max(100, Math.floor(Math.random() * 200) + 50),
        blockchainTransactions: prev.blockchainTransactions + Math.floor(Math.random() * 25),
        securityScore: Math.min(100, prev.securityScore + (Math.random() - 0.5) * 2)
      }));
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">System Overview</h2>
        <button
          onClick={refreshStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   transition-colors duration-200 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="stats-grid">
        {cardData.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? FiTrendingUp : FiTrendingDown;
          
          return (
            <div
              key={index}
              className={`${card.bgColor} cursor-pointer group`}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                border: '1px solid #e5e7eb'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div className="stat-header">
                <div 
                  className={`stat-icon ${card.iconBg}`}
                  style={{
                    backgroundColor: card.color === 'blue' ? '#dbeafe' :
                                   card.color === 'green' ? '#dcfce7' :
                                   card.color === 'purple' ? '#f3e8ff' :
                                   card.color === 'emerald' ? '#d1fae5' : '#f3f4f6'
                  }}
                >
                  <Icon className={`${card.iconColor}`} style={{ fontSize: '1.25rem' }} />
                </div>
                
                <div className={`stat-change ${card.trendUp ? 'positive' : 'negative'}`}>
                  <TrendIcon style={{ marginRight: '0.25rem', fontSize: '0.875rem' }} />
                  <span style={{ fontWeight: '500' }}>
                    {card.trend}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="stat-title">
                  {card.title}
                </h3>
                <p className={`stat-value ${card.textColor}`}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {card.subtitle}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div 
                    className="status-indicator"
                    style={{
                      backgroundColor: card.color === 'blue' ? '#3b82f6' :
                                     card.color === 'green' ? '#10b981' :
                                     card.color === 'purple' ? '#8b5cf6' :
                                     card.color === 'emerald' ? '#10b981' : '#6b7280',
                      animation: 'pulse 2s infinite'
                    }}
                  ></div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Live updates</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>All systems operational</span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Real-time monitoring active</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
