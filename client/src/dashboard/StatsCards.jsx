import React, { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiBell, 
  FiLink,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';

const StatsCards = () => {
  const [stats, setStats] = useState({
    activeEmergencies: 3,
    safeCheckins: 247,
    alertsSent: 18,
    blockchainRecords: 1234
  });

  const [loading, setLoading] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        safeCheckins: prev.safeCheckins + Math.floor(Math.random() * 3),
        blockchainRecords: prev.blockchainRecords + Math.floor(Math.random() * 2)
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const cardData = [
    {
      title: 'Active Emergencies',
      value: stats.activeEmergencies,
      icon: FiAlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
      trend: '+2',
      trendUp: true
    },
    {
      title: 'Safe Check-ins Today',
      value: stats.safeCheckins,
      icon: FiCheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
      trend: '+15',
      trendUp: true
    },
    {
      title: 'Emergency Alerts Sent',
      value: stats.alertsSent,
      icon: FiBell,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-700',
      trend: '+5',
      trendUp: true
    },
    {
      title: 'Blockchain Records',
      value: stats.blockchainRecords.toLocaleString(),
      icon: FiLink,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
      trend: '+12',
      trendUp: true
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
        blockchainRecords: prev.blockchainRecords + Math.floor(Math.random() * 10)
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? FiTrendingUp : FiTrendingDown;
          
          return (
            <div
              key={index}
              className={`
                ${card.bgColor} rounded-xl p-6 shadow-lg hover:shadow-xl 
                transition-all duration-300 transform hover:-translate-y-1
                border border-gray-100 cursor-pointer group
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`
                  p-3 rounded-lg ${card.bgColor} group-hover:scale-110 
                  transition-transform duration-200
                `}>
                  <Icon className={`${card.iconColor} text-2xl`} />
                </div>
                
                <div className="flex items-center space-x-1 text-sm">
                  <TrendIcon className={`${card.trendUp ? 'text-green-500' : 'text-red-500'} text-sm`} />
                  <span className={`${card.trendUp ? 'text-green-600' : 'text-red-600'} font-medium`}>
                    {card.trend}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </h3>
                <p className={`text-3xl font-bold ${card.textColor} mb-2`}>
                  {card.value}
                </p>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    card.color === 'red' ? 'bg-red-400' :
                    card.color === 'green' ? 'bg-green-400' :
                    card.color === 'yellow' ? 'bg-yellow-400' :
                    'bg-blue-400'
                  } animate-pulse`}></div>
                  <span className="text-xs text-gray-500">Live updates</span>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-5 
                            rounded-xl transition-all duration-200"></div>
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
