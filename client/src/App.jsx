import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OTPVerification from './components/Auth/OTPVerification';
import Dashboard from './dashboard';
import UserProfiles from './dashboard/UserProfiles';
import KYCVerification from './components/KYCVerification';
import AdminKYC from './components/AdminKYC';
import DigitalID from './components/DigitalID';
// import EmergencyPanel from './components/Emergency/EmergencyPanel';
// import ResponderPanel from './components/Responder/ResponderPanel';
// import BlockchainPanel from './components/Blockchain/BlockchainPanel';
// import AnalyticsPanel from './components/Analytics/AnalyticsPanel';
// import SettingsPanel from './components/Settings/SettingsPanel';
import './styles/dashboard.css';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<OTPVerification />} />
              
              {/* Dashboard - No authentication required */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* User Profile Route */}
              <Route path="/profile" element={<ProtectedRoute><UserProfiles /></ProtectedRoute>} />
              <Route path="/digital-id" element={<ProtectedRoute><DigitalID /></ProtectedRoute>} />
              <Route path="/kyc" element={<ProtectedRoute><KYCVerification /></ProtectedRoute>} />
              <Route path="/admin/kyc" element={<ProtectedRoute><AdminKYC /></ProtectedRoute>} />
              
              {/* 404 Route */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600">Page not found</p>
                  </div>
                </div>
              } />
            </Routes>
            
            {/* Toast Notifications - Temporarily disabled to fix import error */}
            {/* <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            /> */}
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
