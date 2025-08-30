import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';

const WelcomeBanner = ({ userName = "John Doe" }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState('active'); // 'active' or 'emergency'

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-xl shadow-lg p-6 mb-6 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* Welcome Message */}
        <div className="mb-4 lg:mb-0">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            Welcome back, {userName}. Stay Safe with SafeTourAI 🚨
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-blue-100">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <FiClock className="w-5 h-5 text-blue-600" />
              <span className="font-medium">{formatDate(currentTime)}</span>
            </div>
            <div className="text-lg font-mono">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <div className="mb-3 sm:mb-0">
            <p className="text-blue-100 text-sm mb-1">System Status</p>
            <div className="flex items-center space-x-2">
              {systemStatus === 'active' ? (
                <>
                  <FiCheckCircle className="w-5 h-5" />
                  <span className="font-semibold text-green-300">All Systems Active</span>
                </>
              ) : (
                <>
                  <FiAlertTriangle className="w-5 h-5" />
                  <span className="font-semibold text-yellow-300">Emergency Alerts Active</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Status Toggle (for demo purposes) */}
          <button
            onClick={() => setSystemStatus(systemStatus === 'active' ? 'emergency' : 'active')}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg 
                     transition-all duration-200 text-sm font-medium backdrop-blur-sm
                     border border-white border-opacity-30"
          >
            Toggle Status
          </button>
        </div>
      </div>

      {/* Additional Info Bar */}
      <div className="mt-4 pt-4 border-t border-blue-500 border-opacity-30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-100">Location Services: Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-100">Emergency Network: Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-100">Blockchain: Synchronized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
