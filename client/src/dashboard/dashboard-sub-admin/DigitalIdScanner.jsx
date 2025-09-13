import React, { useState, useRef } from 'react';
import { FiCamera, FiUpload, FiCheck, FiX, FiUser, FiShield, FiEye } from 'react-icons/fi';
import EnhancedQRScanner from '../../components/EnhancedQRScanner';

const DigitalIdScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showEnhancedScanner, setShowEnhancedScanner] = useState(false);
  const [scanHistory, setScanHistory] = useState([
    { id: 1, name: 'John Doe', idNumber: 'ID123456', time: '10:30 AM', status: 'verified' },
    { id: 2, name: 'Jane Smith', idNumber: 'ID789012', time: '10:15 AM', status: 'verified' },
    { id: 3, name: 'Mike Johnson', idNumber: 'ID345678', time: '09:45 AM', status: 'flagged' }
  ]);
  const fileInputRef = useRef(null);

  const handleScan = () => {
    setShowEnhancedScanner(true);
  };

  const handleEnhancedScanResult = (scanData) => {
    // Process the scan result from the enhanced scanner
    if (scanData && scanData.verified && scanData.userData) {
      const newScanResult = {
        name: scanData.userData.fullName,
        idNumber: scanData.digitalId.id,
        nationality: scanData.userData.nationality,
        age: calculateAge(scanData.userData.dateOfBirth),
        verified: scanData.verified,
        emergencyContact: scanData.userData.emergencyContact,
        travelPurpose: scanData.userData.travelPurpose,
        checkInDate: scanData.userData.checkInDate,
        accommodation: scanData.userData.accommodation,
        email: scanData.userData.email,
        gender: scanData.userData.gender,
        governmentIdType: scanData.userData.governmentIdType,
        governmentIdNumber: scanData.userData.governmentIdNumber,
        address: scanData.userData.address,
        kycStatus: scanData.userData.kycStatus,
        blockchainId: scanData.digitalId.id,
        verificationLevel: scanData.digitalId.verificationLevel,
        scannedAt: scanData.scanInfo.scannedAt
      };

      setScanResult(newScanResult);

      // Add to scan history
      const newHistoryEntry = {
        id: Date.now(),
        name: scanData.userData.fullName,
        idNumber: scanData.digitalId.id,
        time: new Date().toLocaleTimeString(),
        status: scanData.verified ? 'verified' : 'flagged'
      };

      setScanHistory(prev => [newHistoryEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
    }
    
    setShowEnhancedScanner(false);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth || dateOfBirth === 'N/A') return 'N/A';
    
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsScanning(true);
      
      try {
        // Create a canvas to read the QR code from the uploaded image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          try {
            // For now, simulate QR reading - in production, use jsQR library
            // Get current user data to simulate a real QR scan
            const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
            
            const mockQRData = {
              type: 'SafeTourDigitalID',
              blockchainId: `ST-${currentUser.uid?.substring(0, 8) || 'TEST123456'}`,
              uid: currentUser.uid || 'test-user-uid',
              verificationLevel: 'Level 3 - Full KYC',
              network: 'SafeTour Blockchain',
              timestamp: '2024-01-01T00:00:00.000Z',
              hash: generateTestPrivateKey(currentUser.uid, currentUser.email),
              issuer: 'SafeTourAI',
              version: '2.0'
            };
            
            // Use the enhanced scanner's verification function
            await verifyQRData(mockQRData);
            
          } catch (error) {
            console.error('QR processing error:', error);
            setScanResult({
              name: 'Error',
              idNumber: 'N/A',
              nationality: 'N/A',
              age: 'N/A',
              verified: false,
              emergencyContact: 'N/A',
              travelPurpose: 'Failed to process QR code',
              checkInDate: 'N/A',
              accommodation: 'N/A'
            });
            setIsScanning(false);
          }
        };
        
        img.src = URL.createObjectURL(file);
        
      } catch (error) {
        console.error('File upload error:', error);
        setIsScanning(false);
      }
    }
  };

  const generateTestPrivateKey = (uid, email) => {
    const staticData = `ST-TEST123456-${uid || email}-SafeTourAI-PrivateKey`;
    let hash = 0;
    for (let i = 0; i < staticData.length; i++) {
      const char = staticData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  };

  const verifyQRData = async (qrData) => {
    try {
      // Get authentication token from various possible sources
      let authToken = null;
      
      // Try different token storage keys
      const tokenSources = [
        'firebaseToken',
        'authToken', 
        'token',
        'accessToken',
        'idToken'
      ];
      
      for (const source of tokenSources) {
        const token = localStorage.getItem(source);
        if (token) {
          authToken = token;
          break;
        }
      }
      
      // If no token found, try to get from Firebase Auth
      if (!authToken) {
        try {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          if (auth.currentUser) {
            authToken = await auth.currentUser.getIdToken();
          }
        } catch (firebaseError) {
          console.log('Firebase auth not available:', firebaseError);
        }
      }
      
      if (!authToken) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch('/api/blockchain/verify-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ qrData })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.verified && data.userData) {
        const newScanResult = {
          name: data.userData.fullName,
          idNumber: data.digitalId.id,
          nationality: data.userData.nationality,
          age: calculateAge(data.userData.dateOfBirth),
          verified: data.verified,
          emergencyContact: data.userData.emergencyContact,
          travelPurpose: data.userData.travelPurpose,
          checkInDate: data.userData.checkInDate,
          accommodation: data.userData.accommodation,
          email: data.userData.email,
          gender: data.userData.gender,
          governmentIdType: data.userData.governmentIdType,
          governmentIdNumber: data.userData.governmentIdNumber,
          address: data.userData.address,
          kycStatus: data.userData.kycStatus,
          blockchainId: data.digitalId.id,
          verificationLevel: data.digitalId.verificationLevel,
          scannedAt: data.scanInfo.scannedAt
        };

        setScanResult(newScanResult);

        // Add to scan history
        const newHistoryEntry = {
          id: Date.now(),
          name: data.userData.fullName,
          idNumber: data.digitalId.id,
          time: new Date().toLocaleTimeString(),
          status: data.verified ? 'verified' : 'flagged'
        };

        setScanHistory(prev => [newHistoryEntry, ...prev.slice(0, 9)]);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('QR verification error:', error);
      setScanResult({
        name: 'Verification Failed',
        idNumber: 'N/A',
        nationality: 'N/A',
        age: 'N/A',
        verified: false,
        emergencyContact: 'N/A',
        travelPurpose: error.message,
        checkInDate: 'N/A',
        accommodation: 'N/A'
      });
    } finally {
      setIsScanning(false);
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
                {scanResult.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold">{scanResult.email}</span>
                  </div>
                )}
                {scanResult.governmentIdType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Type:</span>
                    <span className="font-semibold uppercase">{scanResult.governmentIdType}</span>
                  </div>
                )}
                {scanResult.kycStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">KYC Status:</span>
                    <span className={`font-semibold capitalize ${
                      scanResult.kycStatus === 'approved' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {scanResult.kycStatus}
                    </span>
                  </div>
                )}
                {scanResult.verificationLevel && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verification:</span>
                    <span className="font-semibold text-blue-600">{scanResult.verificationLevel}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 btn btn-primary flex items-center justify-center space-x-2">
                  <FiEye className="w-4 h-4" />
                  <span>View Full Profile</span>
                </button>
                <button className="flex-1 btn btn-secondary flex items-center justify-center space-x-2">
                  <FiShield className="w-4 h-4" />
                  <span>Verify Identity</span>
                </button>
              </div>
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

      {/* Enhanced QR Scanner Modal */}
      <EnhancedQRScanner
        isOpen={showEnhancedScanner}
        onScan={handleEnhancedScanResult}
        onClose={() => setShowEnhancedScanner(false)}
      />
    </div>
  );
};

export default DigitalIdScanner;
