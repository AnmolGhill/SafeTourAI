import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import './styles/dashboard.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/emergency" element={<div>Emergency Page</div>} />
        <Route path="/responder" element={<div>Responder Page</div>} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;
