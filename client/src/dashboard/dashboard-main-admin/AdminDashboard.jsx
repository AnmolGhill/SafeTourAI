import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import AdminWelcomeBanner from './AdminWelcomeBanner';
import AdminStatsCards from './AdminStatsCards';
import FullKYCManagement from './FullKYCManagement';
import UserManagement from './UserManagement';
import SystemAnalytics from './SystemAnalytics';
import SecurityPanel from './SecurityPanel';
import AdminActivityFeed from './AdminActivityFeed';
import SystemSettings from './SystemSettings';
import DatabaseManagement from './DatabaseManagement';
import AuditLogs from './AuditLogs';
import AdminKYC from '../../components/AdminKYC';
import UserProfiles from '../dashboard-user/UserProfiles';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fadeIn">
            <AdminWelcomeBanner userName="Admin" />
            <AdminStatsCards />
            <div className="grid-2 mb-6">
              <div>
                <SystemAnalytics />
                <AdminActivityFeed />
              </div>
              <div>
                <SecurityPanel />
                <DatabaseManagement />
              </div>
            </div>
          </div>
        );
      case 'kyc':
        return <FullKYCManagement />;
      case 'admin-kyc':
        return <AdminKYC />;
      case 'users':
        return <UserManagement />;
      case 'analytics':
        return <SystemAnalytics />;
      case 'security':
        return <SecurityPanel />;
      case 'database':
        return <DatabaseManagement />;
      case 'audit':
        return <AuditLogs />;
      case 'settings':
        return <SystemSettings />;
      case 'reports':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">System Reports</h2>
            <p className="text-gray-600">Generate comprehensive system and user reports.</p>
          </div>
        );
      case 'backup':
        return (
          <div className="card text-center animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Backup & Recovery</h2>
            <p className="text-gray-600">Manage system backups and data recovery options.</p>
          </div>
        );
      case 'profile':
        return <UserProfiles />;
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
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Navbar */}
        <AdminNavbar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onProfileClick={() => setActiveTab('profile')}
        />
        
        {/* Main Content */}
        <main className="content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
