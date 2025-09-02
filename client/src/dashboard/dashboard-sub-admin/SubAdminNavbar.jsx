import React from 'react';
import { FiMenu, FiBell, FiSearch, FiShield } from 'react-icons/fi';

const SubAdminNavbar = ({ sidebarOpen, setSidebarOpen }) => {
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
          <FiShield className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Police Control Panel</h2>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tourists, incidents..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <FiBell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        {/* Status Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700">On Duty</span>
        </div>
      </div>
    </nav>
  );
};

export default SubAdminNavbar;
