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
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Emergency SOS Panel</h2>
            <p className="text-gray-600">Emergency SOS management interface will be implemented here.</p>
          </div>
        );
      case 'responder':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Responder Management</h2>
            <p className="text-gray-600">Full responder panel with detailed management features.</p>
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
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Blockchain Records</h2>
            <p className="text-gray-600">Detailed blockchain transaction history and management.</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Advanced Analytics</h2>
            <p className="text-gray-600">Comprehensive analytics and reporting dashboard.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">System Settings</h2>
            <p className="text-gray-600">Application settings and configuration options.</p>
          </div>
        );
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <Navbar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
