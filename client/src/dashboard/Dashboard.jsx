import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import WelcomeBanner from './WelcomeBanner';
import StatsCards from './StatsCards';
import QuickActions from './QuickActions';
import ActivityFeed from './ActivityFeed';
import BlockchainPanel from './BlockchainPanel';
import AnalyticsChart from './AnalyticsChart';
import ResponderWidget from './ResponderWidget';
import EmergencyPanel from '../components/Emergency/EmergencyPanel';
import ResponderPanel from '../components/Responder/ResponderPanel';
import AnalyticsPanel from '../components/Analytics/AnalyticsPanel';
import SettingsPanel from '../components/Settings/SettingsPanel';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fadeIn">
            <WelcomeBanner userName="John Doe" />
            <StatsCards />
            <div className="grid-2 mb-6">
              <div>
                <QuickActions />
                <ActivityFeed />
              </div>
              <div>
                <BlockchainPanel />
                <ResponderWidget />
              </div>
            </div>
            <AnalyticsChart />
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
      case 'profiles':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">User Profiles</h2>
            <p className="text-gray-600">User profile management interface will be implemented here.</p>
          </div>
        );
      case 'blockchain':
        return <BlockchainPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'settings':
        return <SettingsPanel />;
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
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Navbar */}
        <Navbar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        {/* Main Content */}
        <main className="content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
