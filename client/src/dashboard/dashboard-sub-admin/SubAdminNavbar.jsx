import React from 'react';
import { FiBell, FiSearch, FiShield } from 'react-icons/fi';

const SubAdminNavbar = ({ sidebarOpen, setSidebarOpen }) => {

  return (
    <nav className="sub-admin-navbar">
      {/* Main Navbar Content */}
      <div className="sub-admin-navbar-content">
        {/* Left Section */}
        <div className="sub-admin-navbar-left">
          <div className="sub-admin-logo-section">
            <div className="sub-admin-logo-icon">
              <FiShield className="w-5 h-5" />
            </div>
            <h2 className="sub-admin-title">
              Police Control Panel
            </h2>
          </div>
        </div>

        {/* Right Section */}
        <div className="sub-admin-navbar-right">
          {/* Desktop Search Bar */}
          <div className="sub-admin-search-desktop hidden md:block">
            <FiSearch className="sub-admin-search-icon" />
            <input
              type="text"
              placeholder="Search tourists, incidents..."
              className="sub-admin-search-input"
            />
          </div>

          {/* Mobile Search Button - Removed */}

          {/* Notifications */}
          <button className="sub-admin-notification-btn">
            <FiBell className="w-5 h-5" />
            <span className="sub-admin-notification-badge"></span>
          </button>

          {/* Status Indicator - Compact */}
          <div className="sub-admin-status">
            <div className="sub-admin-status-dot"></div>
            <span className="sub-admin-status-text">
              On Duty
            </span>
          </div>
        </div>
      </div>

    </nav>
  );
};

export default SubAdminNavbar;
