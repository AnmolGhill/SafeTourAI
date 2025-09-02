import React from 'react';
import { FiMenu, FiBell, FiSearch, FiStar, FiActivity } from 'react-icons/fi';

const AdminNavbar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <nav className="navbar">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FiMenu className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center space-x-2">
          <FiStar className="w-6 h-6 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Admin Control Center</h2>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users, logs, KYC..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* System Status */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
          <FiActivity className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">System Online</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <FiBell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></span>
        </button>

        {/* Admin Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 rounded-full">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-sm font-medium text-purple-700">Super Admin</span>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
