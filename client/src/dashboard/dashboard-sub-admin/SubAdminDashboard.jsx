import React, { useState } from 'react';
import SubAdminSidebar from './SubAdminSidebar';
import SubAdminNavbar from './SubAdminNavbar';
import SubAdminWelcomeBanner from './SubAdminWelcomeBanner';
import SubAdminStatsCards from './SubAdminStatsCards';
import DigitalIdScanner from './DigitalIdScanner';
import TouristProfileViewer from './TouristProfileViewer';
import PatrolActivityFeed from './PatrolActivityFeed';
import EmergencyAlerts from './EmergencyAlerts';
import QuickVerification from './QuickVerification';
import IncidentReporting from './IncidentReporting';
import VoiceEmergencyAlerts from './VoiceEmergencyAlerts';

const SubAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fadeIn">
            <SubAdminWelcomeBanner userName="Officer Smith" />
            <SubAdminStatsCards />
            <div className="grid-2 mb-6">
              <div>
                <QuickVerification />
                <PatrolActivityFeed />
              </div>
              <div>
                <EmergencyAlerts />
                <IncidentReporting />
              </div>
            </div>
          </div>
        );
      case 'scanner':
        return <DigitalIdScanner />;
      case 'profiles':
        return <TouristProfileViewer />;
      case 'incidents':
        return <IncidentReporting />;
      case 'emergency':
        return <EmergencyAlerts />;
      case 'voice-emergency':
        return <VoiceEmergencyAlerts />;
      case 'patrol':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Patrol Management</h2>
            <p className="text-gray-600">Patrol route management and tracking interface.</p>
          </div>
        );
      case 'reports':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Reports</h2>
            <p className="text-gray-600">Generate and view patrol reports and statistics.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
            <p className="text-gray-600">Configure sub-admin preferences and notifications.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SubAdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Navbar */}
        <SubAdminNavbar 
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

export default SubAdminDashboard;
