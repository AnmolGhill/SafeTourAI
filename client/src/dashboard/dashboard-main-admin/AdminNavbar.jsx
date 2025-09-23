import React, { useState } from 'react';
import { FiBell, FiSearch, FiStar, FiUser } from 'react-icons/fi';
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
    <nav className="admin-navbar">
      {/* Main Navbar Content */}
      <div className="admin-navbar-content">
        {/* Left Section */}
        <div className="admin-navbar-left">
          <div className="admin-logo-section">
            <div className="admin-logo-icon">
              <FiStar className="w-5 h-5" />
            </div>
            <h2 className="admin-title">
              Admin Control Center
            </h2>
          </div>
        </div>

        {/* Right Section */}
        <div className="admin-navbar-right">
          {/* Desktop Search Bar */}
          <div className="admin-search-desktop hidden md:block">
            <FiSearch className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search users, logs, KYC..."
              className="admin-search-input"
            />
          </div>

          {/* Mobile Search Button - Removed */}

          {/* System Status */}
          <div className="admin-status">
            <div className="admin-status-dot"></div>
            <span className="admin-status-text">
              System Online
            </span>
          </div>

          {/* Notifications */}
          <button className="admin-notification-btn">
            <FiBell className="w-5 h-5" />
            <span className="admin-notification-badge"></span>
          </button>

          {/* User Profile Dropdown */}
          <div className="admin-profile-dropdown">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="admin-profile-btn"
            >
              <div className="admin-profile-avatar">
                <FiUser className="w-4 h-4" />
              </div>
              <div className="admin-profile-info hidden md:block">
                <div className="admin-profile-name">
                  {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
                </div>
                <div className="admin-profile-role">Administrator</div>
              </div>
            </button>

            {showProfileDropdown && (
              <div className="admin-profile-menu">
                <button
                  onClick={handleProfileClick}
                  className="admin-profile-menu-item"
                >
                  <FiUser className="w-4 h-4" />
                  <span>View Profile</span>
                </button>
                <hr className="my-1" />
                <div className="admin-profile-menu-role">
                  Role: Super Admin
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </nav>
  );
};

export default AdminNavbar;
