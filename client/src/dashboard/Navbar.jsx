import React from 'react';
import { FiBell, FiUser, FiChevronDown } from 'react-icons/fi';

const Navbar = () => {
  const currentTime = new Date().toLocaleString();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Tagline */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center lg:hidden">
              <span className="text-white font-bold text-sm">ST</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                SafeTourAI
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                AI-Powered Safety & Emergency Response
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Current Time */}
          <div className="hidden md:block text-sm text-gray-600">
            {currentTime}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <FiBell size={20} />
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">JD</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800">John Doe</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <FiChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
