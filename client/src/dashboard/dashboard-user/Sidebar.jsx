import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import DashboardSelector from '../../components/DashboardSelector';
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
  FiCheckCircle,
  FiUserCheck,
  FiCreditCard,
  FiFileText,
  FiDollarSign as FiWallet
} from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Check authentication from localStorage
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    return !!(token && userData);
  };
  
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
  const userIsAuthenticated = isAuthenticated();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, route: '/dashboard-user', useTab: true },
    { id: 'profile', label: 'User Profiles', icon: FiUser, route: '/profile', useTab: true },
    { id: 'wallet', label: 'Crypto Wallet', icon: FiWallet, route: '/wallet', useTab: false },
    { id: 'digital-id', label: 'Digital ID', icon: FiCreditCard, route: '/digital-id', useTab: false },
    { id: 'kyc', label: 'KYC Verification', icon: FiFileText, route: '/kyc', useTab: false },
    { id: 'emergency', label: 'Emergency SOS', icon: FiAlertTriangle, route: '/emergency', useTab: true },
    { id: 'responder', label: 'Responder Panel', icon: FiUsers, route: '/responder', useTab: true },
    { id: 'blockchain', label: 'Blockchain Records', icon: FiDatabase, route: '/blockchain', useTab: true },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart3, route: '/analytics', useTab: true },
    { id: 'settings', label: 'Settings', icon: FiSettings, route: '/settings', useTab: true },
  ];

  const handleMenuClick = (itemId, route, useTab) => {
    if (useTab) {
      // Use setActiveTab for dashboard navigation
      setActiveTab(itemId);
    } else {
      // Use React Router navigation for standalone pages
      navigate(route);
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    const loadingToast = toast.loading('Signing you out...', {
      position: 'top-center'
    });
    
    // Call logout function (clears localStorage)
    logout();
    
    toast.dismiss();
    toast.success('Logged out successfully!', {
      position: 'top-center',
      duration: 2000
    });
    
    setTimeout(() => {
      navigate('/login');
      setIsOpen(false);
    }, 1000);
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
                <FiAlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">SafeTourAI</h1>
                <p className="text-xs text-gray-500">Emergency Response</p>
              </div>
            </div>
            
            {/* Dashboard Selector */}
            <DashboardSelector currentDashboard="user" />
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
            {userIsAuthenticated ? (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 
                       user?.fullName ? user.fullName.charAt(0).toUpperCase() : 
                       user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {user?.name || user?.fullName || user?.displayName || 'Demo User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'demo@example.com'}
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

export default Sidebar;
