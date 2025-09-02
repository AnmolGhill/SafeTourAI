import React from 'react';
import { FiShield, FiClock, FiMapPin } from 'react-icons/fi';

const SubAdminWelcomeBanner = ({ userName = "Officer Smith" }) => {
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
    <div className="card mb-6 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <FiShield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
              <p className="text-blue-100">Police Sub-Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <FiClock className="w-4 h-4" />
              <span className="text-sm">{currentTime} - {currentDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiMapPin className="w-4 h-4" />
              <span className="text-sm">Central District Patrol</span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:block">
          <div className="text-right">
            <div className="text-3xl font-bold">12</div>
            <div className="text-sm text-blue-100">Active Patrols</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubAdminWelcomeBanner;
