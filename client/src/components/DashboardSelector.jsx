import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiShield, FiSettings, FiChevronDown } from 'react-icons/fi';

const DashboardSelector = ({ currentDashboard = 'user' }) => {
  const navigate = useNavigate();

  const dashboards = [
    {
      id: 'user',
      name: 'User Dashboard',
      description: 'Tourist & Emergency Services',
      icon: FiHome,
      route: '/dashboard-user',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'sub-admin',
      name: 'Police Dashboard',
      description: 'ID Scanning & Tourist Management',
      icon: FiShield,
      route: '/dashboard/sub-admin',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      id: 'admin',
      name: 'Admin Dashboard',
      description: 'Full System Control',
      icon: FiSettings,
      route: '/dashboard/admin',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const currentDashboardInfo = dashboards.find(d => d.id === currentDashboard) || dashboards[0];

  const handleDashboardChange = (route) => {
    navigate(route);
  };

  return (
    <div className="relative group">
      <button className="w-full flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 ${currentDashboardInfo.bgColor} rounded-lg flex items-center justify-center`}>
            <currentDashboardInfo.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${currentDashboardInfo.color}`} />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-800 text-xs sm:text-sm">{currentDashboardInfo.name}</div>
            <div className="text-xs text-gray-500 leading-tight">{currentDashboardInfo.description}</div>
          </div>
        </div>
        <FiChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </button>

      {/* Dropdown Menu */}
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {dashboards.map((dashboard) => (
          <button
            key={dashboard.id}
            onClick={() => handleDashboardChange(dashboard.route)}
            className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
              dashboard.id === currentDashboard ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className={`w-8 h-8 ${dashboard.bgColor} rounded-lg flex items-center justify-center`}>
              <dashboard.icon className={`w-4 h-4 ${dashboard.color}`} />
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{dashboard.name}</div>
              <div className="text-xs text-gray-500">{dashboard.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardSelector;
