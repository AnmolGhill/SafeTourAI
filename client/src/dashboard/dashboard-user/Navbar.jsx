import React from 'react';
import { FiBell, FiUser, FiChevronDown } from 'react-icons/fi';

const Navbar = () => {
  const currentTime = new Date().toLocaleString();
  
  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const user = getCurrentUser();
  const userName = user?.name || user?.fullName || "User";
  const userInitials = userName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  const userRole = user?.role || "User";

  return (
    <nav className="dashboard-navbar">
      <div className="mobile-navbar-container">
        {/* Left Section */}
        <div className="mobile-navbar-left">
          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn lg:hidden"
            onClick={() => {
              const event = new CustomEvent('toggleSidebar');
              window.dispatchEvent(event);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Logo */}
          <div className="mobile-logo">
            <div className="mobile-logo-icon">
              <span>ST</span>
            </div>
            <div>
              <div className="mobile-logo-text">SafeTourAI</div>
              <div className="mobile-logo-subtitle">AI-Powered Safety & Emergency Response</div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="mobile-navbar-right">
          {/* Current Time - Desktop Only */}
          <div className="navbar-time hidden lg:flex items-center px-3 py-2 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">{currentTime}</span>
          </div>

          {/* Notification */}
          <button className="mobile-notification">
            <FiBell size={18} />
            <div className="mobile-notification-badge"></div>
          </button>

          {/* Profile */}
          <div className="mobile-profile">
            <div className="mobile-profile-avatar">
              <span>{userInitials}</span>
              <div className="mobile-profile-status"></div>
            </div>
            <div className="mobile-profile-info">
              <div className="mobile-profile-name">{userName}</div>
              <div className="mobile-profile-role">{userRole}</div>
            </div>
            <FiChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
