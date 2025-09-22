import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OTPVerification from './components/Auth/OTPVerification';
import ForgotPassword from './components/Auth/ForgotPassword';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Dashboard Components
import Dashboard from './components/Dashboard';
import RoleBasedDashboard from './components/RoleBasedDashboard';
import DashboardSelector from './components/DashboardSelector';

// User Dashboard
import UserDashboard from './dashboard/dashboard-user/UserDashboard';
import UserNavbar from './dashboard/dashboard-user/Navbar';
import UserSidebar from './dashboard/dashboard-user/Sidebar';
import WelcomeBanner from './dashboard/dashboard-user/WelcomeBanner';
import StatsCards from './dashboard/dashboard-user/StatsCards';
import QuickActions from './dashboard/dashboard-user/QuickActions';
import ActivityFeed from './dashboard/dashboard-user/ActivityFeed';
import BlockchainPanel from './dashboard/dashboard-user/BlockchainPanel';
import AnalyticsChart from './dashboard/dashboard-user/AnalyticsChart';
import ResponderWidget from './dashboard/dashboard-user/ResponderWidget';
import UserProfiles from './dashboard/dashboard-user/UserProfiles';

// Sub-Admin Dashboard
import SubAdminDashboard from './dashboard/dashboard-sub-admin/SubAdminDashboard';
import SubAdminNavbar from './dashboard/dashboard-sub-admin/SubAdminNavbar';
import SubAdminSidebar from './dashboard/dashboard-sub-admin/SubAdminSidebar';
import SubAdminWelcomeBanner from './dashboard/dashboard-sub-admin/SubAdminWelcomeBanner';
import SubAdminStatsCards from './dashboard/dashboard-sub-admin/SubAdminStatsCards';
import DigitalIdScanner from './dashboard/dashboard-sub-admin/DigitalIdScanner';
import TouristProfileViewer from './dashboard/dashboard-sub-admin/TouristProfileViewer';
import PatrolActivityFeed from './dashboard/dashboard-sub-admin/PatrolActivityFeed';
import EmergencyAlerts from './dashboard/dashboard-sub-admin/EmergencyAlerts';
import QuickVerification from './dashboard/dashboard-sub-admin/QuickVerification';
import IncidentReporting from './dashboard/dashboard-sub-admin/IncidentReporting';

// Admin Dashboard
import AdminDashboard from './dashboard/dashboard-main-admin/AdminDashboard';
import AdminNavbar from './dashboard/dashboard-main-admin/AdminNavbar';
import AdminSidebar from './dashboard/dashboard-main-admin/AdminSidebar';
import AdminWelcomeBanner from './dashboard/dashboard-main-admin/AdminWelcomeBanner';
import AdminStatsCards from './dashboard/dashboard-main-admin/AdminStatsCards';
import AdminActivityFeed from './dashboard/dashboard-main-admin/AdminActivityFeed';
import FullKYCManagement from './dashboard/dashboard-main-admin/FullKYCManagement';
import UserManagement from './dashboard/dashboard-main-admin/UserManagement';
import SystemAnalytics from './dashboard/dashboard-main-admin/SystemAnalytics';
import SecurityPanel from './dashboard/dashboard-main-admin/SecurityPanel';
import SystemSettings from './dashboard/dashboard-main-admin/SystemSettings';
import DatabaseManagement from './dashboard/dashboard-main-admin/DatabaseManagement';
import AuditLogs from './dashboard/dashboard-main-admin/AuditLogs';

// KYC Components
import KYCVerification from './components/KYCVerification';
import AdminKYC from './components/AdminKYC';

// Utility Components
import DigitalID from './components/DigitalID';
import QRScanner from './components/QRScanner';
import ErrorBoundary from './components/ErrorBoundary';
import ResponderPanel from './components/Responder/ResponderPanel';
import SettingsPanel from './components/Settings/SettingsPanel';

// Wallet Component
import Wallet from './components/Wallet/Wallet';

// CSS
import './App.css';
import './styles/dashboard.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
            <div className="App">
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/home" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<OTPVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <RoleBasedDashboard />
                </ProtectedRoute>
              } />

              {/* User Dashboard Routes */}
              <Route path="/dashboard-user" element={
                <ProtectedRoute requiredRole="user">
                  <UserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/user" element={
                <ProtectedRoute requiredRole="user">
                  <UserDashboard />
                </ProtectedRoute>
              } />

              {/* Sub-Admin Dashboard Routes */}
              <Route path="/dashboard/sub-admin" element={
                <ProtectedRoute requiredRole="subadmin">
                  <SubAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/sub-admin/scanner" element={
                <ProtectedRoute requiredRole="subadmin">
                  <DigitalIdScanner />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/sub-admin/profiles" element={
                <ProtectedRoute requiredRole="subadmin">
                  <TouristProfileViewer />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/sub-admin/incidents" element={
                <ProtectedRoute requiredRole="subadmin">
                  <IncidentReporting />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/sub-admin/emergency" element={
                <ProtectedRoute requiredRole="subadmin">
                  <EmergencyAlerts />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/sub-admin/verification" element={
                <ProtectedRoute requiredRole="subadmin">
                  <QuickVerification />
                </ProtectedRoute>
              } />

              {/* Admin Dashboard Routes */}
              <Route path="/dashboard/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin/kyc" element={
                <ProtectedRoute requiredRole="admin">
                  <FullKYCManagement />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin/analytics" element={
                <ProtectedRoute requiredRole="admin">
                  <SystemAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin/security" element={
                <ProtectedRoute requiredRole="admin">
                  <SecurityPanel />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin/database" element={
                <ProtectedRoute requiredRole="admin">
                  <DatabaseManagement />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin/audit" element={
                <ProtectedRoute requiredRole="admin">
                  <AuditLogs />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <SystemSettings />
                </ProtectedRoute>
              } />

              {/* KYC Routes */}
              <Route path="/kyc" element={
                <ProtectedRoute>
                  <KYCVerification />
                </ProtectedRoute>
              } />
              <Route path="/kyc-verification" element={
                <ProtectedRoute>
                  <KYCVerification />
                </ProtectedRoute>
              } />
              <Route path="/admin-kyc" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminKYC />
                </ProtectedRoute>
              } />

              {/* User Profile Route */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfiles />
                </ProtectedRoute>
              } />

              {/* Utility Routes */}
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } />
              <Route path="/digital-id" element={
                <ProtectedRoute>
                  <DigitalID />
                </ProtectedRoute>
              } />
              <Route path="/qr-scanner" element={
                <ProtectedRoute>
                  <QRScanner />
                </ProtectedRoute>
              } />
              <Route path="/responder" element={
                <ProtectedRoute>
                  <ResponderPanel />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPanel />
                </ProtectedRoute>
              } />

              {/* Dashboard Selector */}
              <Route path="/dashboard-selector" element={
                <ProtectedRoute>
                  <DashboardSelector />
                </ProtectedRoute>
              } />

              {/* Individual Component Routes for Testing/Direct Access */}
              <Route path="/components/user-profiles" element={
                <ProtectedRoute>
                  <UserProfiles />
                </ProtectedRoute>
              } />
              <Route path="/components/blockchain" element={
                <ProtectedRoute>
                  <BlockchainPanel />
                </ProtectedRoute>
              } />
              <Route path="/components/analytics" element={
                <ProtectedRoute>
                  <AnalyticsChart />
                </ProtectedRoute>
              } />
              <Route path="/components/quick-actions" element={
                <ProtectedRoute>
                  <QuickActions />
                </ProtectedRoute>
              } />
              <Route path="/components/activity-feed" element={
                <ProtectedRoute>
                  <ActivityFeed />
                </ProtectedRoute>
              } />

              {/* Legacy Routes for Backward Compatibility */}
              <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
              <Route path="/sub-admin" element={<Navigate to="/dashboard/sub-admin" replace />} />
              <Route path="/user" element={<Navigate to="/dashboard/user" replace />} />
              <Route path="/admin-dashboard" element={<Navigate to="/dashboard/admin" replace />} />
              <Route path="/sub-admin-dashboard" element={<Navigate to="/dashboard/sub-admin" replace />} />
              <Route path="/user-dashboard" element={<Navigate to="/dashboard/user" replace />} />

              {/* 404 Route */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-8">Page not found</p>
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </Router>
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '12px 16px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              duration: 2000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              duration: Infinity,
            },
          }}
        />
      </ErrorBoundary>
  );
}

export default App;