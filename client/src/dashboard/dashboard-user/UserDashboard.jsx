import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import WelcomeBanner from './WelcomeBanner';
import StatsCards from './StatsCards';
import SafetyScoreCard from './SafetyScoreCard';
import QuickActions from './QuickActions';
import ActivityFeed from './ActivityFeed';
import BlockchainPanel from './BlockchainPanel';
import DangerZoneHeatmap from './DangerZoneHeatmap';
import ServicesWidget from './ServicesWidget';
import UserProfiles from './UserProfiles';
import SafeTourChatbot from './SafeTourChatbot';
import ChatbotPage from './ChatbotPage';
import SmartWatch from './SmartWatch';
import EmergencyPanel from '../../components/Emergency/EmergencyPanel';
import ResponderPanel from '../../components/Responder/ResponderPanel';
import AnalyticsPanel from '../../components/Analytics/AnalyticsPanel';
import SettingsPanel from '../../components/Settings/SettingsPanel';
import LocationDebugger from '../../components/LocationDebugger';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fadeIn">
            <WelcomeBanner userName={user?.name || user?.fullName || "User"} />
            <StatsCards />
            <div className="grid-2 mb-6">
              <div className="space-y-6">
                <QuickActions />
                <ActivityFeed />
              </div>
              <div className="space-y-6">
                <SafetyScoreCard />
                <DangerZoneHeatmap />
                <ServicesWidget />
              </div>
            </div>
          </div>
        );
      case 'emergency':
        return <EmergencyPanel />;
      case 'responder':
        return <ResponderPanel />;
      case 'kyc':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">KYC Verification</h2>
            <p className="text-gray-600">Know Your Customer verification interface will be implemented here.</p>
          </div>
        );
      case 'profile':
        return <UserProfiles />;
      case 'chatbot':
        return <ChatbotPage />;
      case 'smartwatch':
        return <SmartWatch />;
      case 'blockchain':
        return <BlockchainPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'location-debug':
        return <LocationDebugger />;
      default:
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
            <p className="text-gray-600">The requested page could not be found.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="mobile-dashboard-content flex-1 lg:ml-64">
          {renderContent()}
        </main>
      </div>
      
      {/* Floating Chatbot - Only for dashboard-user */}
      <SafeTourChatbot activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default UserDashboard;
