// import React from 'react';
// import { FiBell, FiUser, FiChevronDown } from 'react-icons/fi';
// import LanguageSelector from './components/LanguageSelector';
// import { useLanguage } from './contexts/LanguageContext';

// const Navbar = () => {
//   const { t } = useLanguage();
//   const currentTime = new Date().toLocaleString();
  
//   // Get current user from localStorage
//   const getCurrentUser = () => {
//     try {
//       const userData = localStorage.getItem('userData');
//       return userData ? JSON.parse(userData) : null;
//     } catch (error) {
//       console.error('Error parsing user data:', error);
//       return null;
//     }
//   };

//   const user = getCurrentUser();
//   const userName = user?.name || user?.fullName || "User";
//   const userInitials = userName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
//   const userRole = user?.role || "User";

//   return (
//     <nav className="dashboard-navbar">
//       <div className="mobile-navbar-container">
//         {/* Left Section */}
//         <div className="mobile-navbar-left">
//           {/* Mobile Menu Button */}
//           <button
//             className="mobile-menu-btn lg:hidden"
//             onClick={() => {
//               const event = new CustomEvent('toggleSidebar');
//               window.dispatchEvent(event);
//             }}
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           </button>
          
//           {/* Logo */}
//           <div className="mobile-logo">
//             <div className="mobile-logo-icon">
//               <span>ST</span>
//             </div>
//             <div>
//               <div className="mobile-logo-text">SafeTourAI</div>
//               <div className="mobile-logo-subtitle">AI-Powered Safety & Emergency Response</div>
//             </div>
//           </div>
//         </div>

//         {/* Right Section */}
//         <div className="mobile-navbar-right">
//           {/* Current Time - Desktop Only */}
//           <div className="navbar-time hidden lg:flex items-center px-3 py-2 bg-gray-50 rounded-lg">
//             <span className="text-sm font-medium text-gray-700">{currentTime}</span>
//           </div>

//           {/* Language Selector */}
//           <div className="flex items-center">
//             <LanguageSelector />
//           </div>

//           {/* Notification */}
//           <button className="mobile-notification">
//             <FiBell size={18} />
//             <div className="mobile-notification-badge"></div>
//           </button>

//           {/* Profile */}
//           <div className="mobile-profile">
//             <div className="mobile-profile-avatar">
//               <span>{userInitials}</span>
//               <div className="mobile-profile-status"></div>
//             </div>
//             <div className="mobile-profile-info">
//               <div className="mobile-profile-name">{userName}</div>
//               <div className="mobile-profile-role">{userRole}</div>
//             </div>
//             <FiChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
import "./components/Navbar.css";
import React, { useState } from 'react';
import { FiBell, FiChevronDown, FiGlobe } from 'react-icons/fi';
import LanguageSelector from './components/LanguageSelector';
import { useLanguage } from './contexts/LanguageContext';

const Navbar = () => {
  const { t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const currentTime = new Date().toLocaleString();

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
  const userInitials = userName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const userRole = user?.role || "User";

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-container">

        {/* LEFT SIDE */}
        <div className="navbar-left">
          <button
            className="menu-btn"
            onClick={() => {
              const event = new CustomEvent('toggleSidebar');
              window.dispatchEvent(event);
            }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="logo-wrapper">
            {/* <div className="logo-icon">ST</div> */}
            <div className="logo-text-wrapper">
              <div className="logo-text">SafeTourAI</div>
              <div className="logo-subtitle">AI-Powered Safety & Emergency</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="navbar-right">

          {/* Desktop Time */}
          <div className="navbar-time">
            {currentTime}
          </div>

          {/* Language */}
          <div className="language-wrapper">
            <LanguageSelector />
          </div>

          {/* Notification */}
          <button className="notification-btn">
            <FiBell size={18} />
            <span className="notification-dot"></span>
          </button>

          {/* Profile */}
          <div className="profile-wrapper">
            <div className="profile-avatar">
              {userInitials}
              <span className="status-dot"></span>
            </div>

            <div className="profile-info">
              <div className="profile-name">{userName}</div>
              <div className="profile-role">{userRole}</div>
            </div>

            <FiChevronDown className="profile-chevron" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;