import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import DashboardSelector from '../../components/DashboardSelector';
import { 
  FiHome, 
  FiCamera, 
  FiUsers, 
  FiUser, 
  FiShield, 
  FiAlertTriangle, 
  FiSettings, 
  FiMenu, 
  FiX,
  FiLogOut,
  FiFileText,
  FiMapPin,
  FiBarChart2,
  FiEye
} from 'react-icons/fi';

const SubAdminSidebar = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, useTab: true },
    { id: 'scanner', label: 'ID Scanner', icon: FiCamera, useTab: true },
    { id: 'profiles', label: 'Tourist Profiles', icon: FiUsers, useTab: true },
    { id: 'incidents', label: 'Incident Reports', icon: FiFileText, useTab: true },
    { id: 'emergency', label: 'Emergency Alerts', icon: FiAlertTriangle, useTab: true },
    { id: 'patrol', label: 'Patrol Routes', icon: FiMapPin, useTab: true },
    { id: 'reports', label: 'Reports', icon: FiBarChart2, useTab: true },
    { id: 'settings', label: 'Settings', icon: FiSettings, useTab: true },
  ];

  const handleMenuClick = (itemId, route, useTab) => {
    if (useTab) {
      setActiveTab(itemId);
    } else {
      navigate(route);
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  const handleLogin = () => {
    navigate('/login');
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40
        w-64 bg-white shadow-xl border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col lg:translate-x-0
      `}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '256px',
          height: '100vh',
          zIndex: 1000,
          overflowY: 'auto'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
                <FiShield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">SafeTourAI</h1>
                <p className="text-xs text-gray-500">Police Dashboard</p>
              </div>
            </div>
            
            {/* Dashboard Selector */}
            <DashboardSelector currentDashboard="sub-admin" />
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id, item.route, item.useTab)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                    text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Auth Button */}
          <div className="p-4 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'P'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {user?.displayName || 'Officer Smith'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Police Sub-Admin
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                           text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                         text-blue-600 hover:bg-blue-50 transition-colors duration-200"
              >
                <FiUser className="w-5 h-5" />
                <span className="font-medium">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SubAdminSidebar;
