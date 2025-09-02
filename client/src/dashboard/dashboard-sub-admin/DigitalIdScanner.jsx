import React, { useState, useRef } from 'react';
import { FiCamera, FiUpload, FiCheck, FiX, FiUser, FiShield } from 'react-icons/fi';

const DigitalIdScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([
    { id: 1, name: 'John Doe', idNumber: 'ID123456', time: '10:30 AM', status: 'verified' },
    { id: 2, name: 'Jane Smith', idNumber: 'ID789012', time: '10:15 AM', status: 'verified' },
    { id: 3, name: 'Mike Johnson', idNumber: 'ID345678', time: '09:45 AM', status: 'flagged' }
  ]);
  const fileInputRef = useRef(null);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate scanning process
    setTimeout(() => {
      setScanResult({
        name: 'Alex Rodriguez',
        idNumber: 'ID567890',
        nationality: 'Spain',
        age: 28,
        verified: true,
        emergencyContact: '+34 123 456 789',
        travelPurpose: 'Tourism',
        checkInDate: '2024-08-28',
        accommodation: 'Grand Hotel Central'
      });
      setIsScanning(false);
    }, 2000);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsScanning(true);
      // Simulate file processing
      setTimeout(() => {
        setScanResult({
          name: 'Maria Garcia',
          idNumber: 'ID998877',
          nationality: 'Mexico',
          age: 32,
          verified: true,
          emergencyContact: '+52 555 123 4567',
          travelPurpose: 'Business',
          checkInDate: '2024-08-30',
          accommodation: 'Business Center Hotel'
        });
        setIsScanning(false);
      }, 1500);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Digital ID Scanner</h2>
        <p className="text-gray-600">Scan tourist digital IDs to verify identity and access profiles</p>
      </div>

      <div className="grid-2 mb-6">
        {/* Scanner Interface */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">ID Scanner</h3>
          
          <div className="space-y-4">
            {/* Camera Scan Button */}
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full btn btn-primary flex items-center justify-center space-x-2 py-4"
            >
              <FiCamera className="w-5 h-5" />
              <span>{isScanning ? 'Scanning...' : 'Start Camera Scan'}</span>
            </button>

            {/* File Upload */}
            <div className="text-center">
              <span className="text-gray-500">or</span>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="w-full btn btn-secondary flex items-center justify-center space-x-2 py-4"
            >
              <FiUpload className="w-5 h-5" />
              <span>Upload ID Image</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {isScanning && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing ID...</p>
              </div>
            )}
          </div>
        </div>

        {/* Scan Result */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Scan Result</h3>
          
          {scanResult ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <FiCheck className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">ID Verified Successfully</p>
                  <p className="text-sm text-green-600">Tourist profile found and validated</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{scanResult.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID Number:</span>
                  <span className="font-semibold">{scanResult.idNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nationality:</span>
                  <span className="font-semibold">{scanResult.nationality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-semibold">{scanResult.age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Travel Purpose:</span>
                  <span className="font-semibold">{scanResult.travelPurpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in Date:</span>
                  <span className="font-semibold">{scanResult.checkInDate}</span>
                </div>
              </div>

              <button className="w-full btn btn-primary">
                View Full Profile
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiUser className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No scan result yet</p>
              <p className="text-sm">Use the scanner to verify a tourist ID</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Scans</h3>
        
        <div className="space-y-3">
          {scanHistory.map((scan) => (
            <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  scan.status === 'verified' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="font-semibold text-gray-800">{scan.name}</p>
                  <p className="text-sm text-gray-600">{scan.idNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{scan.time}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  scan.status === 'verified' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {scan.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalIdScanner;
