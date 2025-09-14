import React, { useState, useEffect } from 'react';
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
  FiDollarSign as FiWallet,
  FiMessageCircle,
  FiWatch
} from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Listen for toggle events from navbar
  useEffect(() => {
    const handleToggle = () => setIsOpen(!isOpen);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, [isOpen]);
  
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
    { id: 'chatbot', label: 'SafeTour Chatbot', icon: FiMessageCircle, route: '/chatbot', useTab: true },
    { id: 'smartwatch', label: 'SmartWatch Connect', icon: FiWatch, route: '/smartwatch', useTab: true },
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

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        w-24 sm:w-20 lg:w-16 bg-white shadow-2xl border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col lg:translate-x-0 lg:static lg:z-auto
        h-screen overflow-y-auto
      `}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile only */}
          <div className="lg:hidden p-2 border-b border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiX className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-1 py-2 sm:px-2 sm:py-2 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id, item.route, item.useTab)}
                  className={`
                    w-full flex flex-col items-center justify-center px-1 py-3 rounded-lg
                    text-center transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }
                  `}
                  title={item.label}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 mb-1" />
                  <span className="font-medium text-xs leading-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Auth Button */}
          <div className="px-1 py-2 sm:px-2 sm:py-2 border-t border-gray-200">
            {userIsAuthenticated ? (
              <>
                <button
                  onClick={handleLogout}
                  className="w-full flex flex-col items-center justify-center px-1 py-3 rounded-lg
                           text-red-600 hover:bg-red-50 transition-colors duration-200"
                  title="Logout"
                >
                  <FiLogOut className="w-5 h-5 flex-shrink-0 mb-1" />
                  <span className="font-medium text-xs leading-tight">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full flex flex-col items-center justify-center px-1 py-3 rounded-lg
                         text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                title="Login"
              >
                <FiUser className="w-5 h-5 flex-shrink-0 mb-1" />
                <span className="font-medium text-xs leading-tight">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
