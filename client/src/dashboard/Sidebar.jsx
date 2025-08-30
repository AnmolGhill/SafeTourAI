import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiAlertTriangle, 
  FiUsers, 
  FiUser, 
  FiShield, 
  FiBarChart2 as FiBarChart3, 
  FiSettings, 
  FiMenu, 
  FiX,
  FiLogOut,
  FiDatabase,
  FiCheckCircle
} from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, route: '/dashboard' },
    { id: 'kyc', label: 'KYC Verification', icon: FiCheckCircle, route: '/kyc' },
    { id: 'emergency', label: 'Emergency SOS', icon: FiAlertTriangle, route: '/emergency' },
    { id: 'responder', label: 'Responder Panel', icon: FiUsers, route: '/responder' },
    { id: 'profiles', label: 'User Profiles', icon: FiUser, route: '/profiles' },
    { id: 'blockchain', label: 'Blockchain Records', icon: FiDatabase, route: '/blockchain' },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart3, route: '/analytics' },
    { id: 'settings', label: 'Settings', icon: FiSettings, route: '/settings' },
  ];

  const handleMenuClick = (itemId, route) => {
    if (route) {
      navigate(route);
    } else {
      setActiveTab(itemId);
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logout clicked');
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">SafeTourAI</h1>
                <p className="text-xs text-gray-500">Emergency Response</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id, item.route)}
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

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JD</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">John Doe</p>
                <p className="text-xs text-gray-500">Administrator</p>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
