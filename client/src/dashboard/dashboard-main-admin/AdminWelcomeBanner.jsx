import React from 'react';
import { FiStar, FiClock, FiActivity, FiShield } from 'react-icons/fi';

const AdminWelcomeBanner = ({ userName = "System Admin" }) => {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="card mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <FiStar className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Welcome, {userName}!</h1>
              <p className="text-purple-100">System Administrator Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <FiClock className="w-4 h-4" />
              <span className="text-sm">{currentTime} - {currentDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiActivity className="w-4 h-4" />
              <span className="text-sm">All Systems Operational</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiShield className="w-4 h-4" />
              <span className="text-sm">Security Level: Maximum</span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:block">
          <div className="text-right space-y-2">
            <div>
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-sm text-purple-100">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold">98.7%</div>
              <div className="text-sm text-purple-100">System Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWelcomeBanner;
