import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import UserProfiles from './dashboard/UserProfiles';
import KYCVerification from './components/KYCVerification';
import AdminKYC from './components/AdminKYC';
import './styles/dashboard.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profiles" element={<UserProfiles />} />
        <Route path="/kyc" element={<KYCVerification />} />
        <Route path="/admin/kyc" element={<AdminKYC />} />
        <Route path="/emergency" element={<div>Emergency Page</div>} />
        <Route path="/responder" element={<div>Responder Page</div>} />
        <Route path="/blockchain" element={<div>Blockchain Records Page</div>} />
        <Route path="/analytics" element={<div>Analytics Page</div>} />
        <Route path="/settings" element={<div>Settings Page</div>} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;
