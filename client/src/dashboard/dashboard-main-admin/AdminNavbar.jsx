import React, { useState } from 'react';
import { FiMenu, FiBell, FiSearch, FiStar, FiActivity, FiUser } from 'react-icons/fi';
import { useAuth } from '../../utils/auth';

const AdminNavbar = ({ sidebarOpen, setSidebarOpen, onProfileClick }) => {
  const { user } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    }
    setShowProfileDropdown(false);
  };

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

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <FiUser className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-700">
                {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
              </div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={handleProfileClick}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <FiUser className="w-4 h-4" />
                <span>View Profile</span>
              </button>
              <hr className="my-1" />
              <div className="px-4 py-2 text-xs text-gray-500">
                Role: Super Admin
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
