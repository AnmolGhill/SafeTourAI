import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCamera, 
  FiX, 
  FiCheckCircle, 
  FiAlertCircle,
  FiRefreshCw,
  FiUser,
  FiShield,
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiFileText
} from 'react-icons/fi';

const EnhancedQRScanner = ({ onScan, onClose, isOpen }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setScanning(true);
      setError(null);
      setResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start QR detection after video starts playing
        videoRef.current.onloadedmetadata = () => {
          startQRDetection();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions and try again.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };

  const startQRDetection = () => {
    const detectQR = () => {
      if (!videoRef.current || !canvasRef.current || !scanning) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Simple QR detection simulation - in real implementation, use a QR library like jsQR
        // For now, we'll simulate QR detection with manual input
        // You can integrate jsQR library here for actual QR detection
      }

      if (scanning) {
        requestAnimationFrame(detectQR);
      }
    };

    detectQR();
  };

  const verifyDigitalId = async (qrData) => {
    try {
      setLoading(true);
      setError(null);

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
      
      if (data.success && data.verified) {
        setResult({
          verified: true,
          digitalId: data.digitalId,
          userData: data.userData,
          scanInfo: data.scanInfo,
          message: 'Digital ID verified successfully!'
        });
        
        // Call parent callback with scan result
        if (onScan) {
          onScan(data);
        }
      } else {
        setResult({
          verified: false,
          message: data.error || 'Digital ID verification failed'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        verified: false,
        message: 'Error verifying Digital ID: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = () => {
    const input = prompt('Enter QR code data (JSON format):');
    if (input) {
      try {
        const qrData = JSON.parse(input.trim());
        verifyDigitalId(qrData);
      } catch (error) {
        setError('Invalid QR data format. Please enter valid JSON.');
      }
    }
  };

  const simulateQRScan = () => {
    // Get current user data to simulate a real QR scan
    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Generate consistent private key for test user
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

    const mockQRData = {
      type: 'SafeTourDigitalID',
      blockchainId: 'ST-TEST123456',
      uid: currentUser.uid || 'test-user-uid',
      verificationLevel: 'Level 3 - Full KYC',
      network: 'SafeTour Blockchain',
      timestamp: '2024-01-01T00:00:00.000Z', // Fixed timestamp for consistency
      hash: generateTestPrivateKey(currentUser.uid, currentUser.email),
      issuer: 'SafeTourAI',
      version: '2.0'
    };
    
    verifyDigitalId(mockQRData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Digital ID Scanner</h3>
            <p className="text-sm text-gray-600">Scan tourist digital IDs for verification</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <FiAlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Camera Scanner</h4>
              
              {scanning ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-4 top-1/2 h-0.5 bg-blue-500 opacity-75 animate-pulse"></div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-sm p-2 rounded">
                    Position QR code within the frame
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FiCamera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Camera not active</p>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={scanning ? stopCamera : startCamera}
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors font-medium ${
                    scanning 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : scanning ? (
                    <>
                      <FiX className="w-4 h-4" />
                      <span>Stop Camera</span>
                    </>
                  ) : (
                    <>
                      <FiCamera className="w-4 h-4" />
                      <span>Start Camera</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleManualInput}
                  disabled={loading}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                >
                  Manual Input
                </button>
                
                <button
                  onClick={simulateQRScan}
                  disabled={loading}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  Test Scan
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Scan Results</h4>
              
              {result ? (
                <div className={`border rounded-lg p-4 ${
                  result.verified 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {/* Status Header */}
                  <div className="flex items-center space-x-2 mb-4">
                    {result.verified ? (
                      <FiCheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <FiAlertCircle className="w-6 h-6 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      result.verified ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.message}
                    </span>
                  </div>
                  
                  {/* User Details */}
                  {result.verified && result.userData && (
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center space-x-3 mb-3">
                          <FiUser className="w-5 h-5 text-blue-600" />
                          <h5 className="font-semibold text-gray-800">Personal Information</h5>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{result.userData.fullName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium">{result.userData.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date of Birth:</span>
                            <span className="font-medium">{result.userData.dateOfBirth}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gender:</span>
                            <span className="font-medium capitalize">{result.userData.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nationality:</span>
                            <span className="font-medium">{result.userData.nationality}</span>
                          </div>
                        </div>
                      </div>

                      {/* ID Information */}
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center space-x-3 mb-3">
                          <FiFileText className="w-5 h-5 text-purple-600" />
                          <h5 className="font-semibold text-gray-800">ID Information</h5>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">ID Type:</span>
                            <span className="font-medium uppercase">{result.userData.governmentIdType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">ID Number:</span>
                            <span className="font-medium font-mono">{result.userData.governmentIdNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">KYC Status:</span>
                            <span className={`font-medium capitalize ${
                              result.userData.kycStatus === 'approved' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {result.userData.kycStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      {result.userData.address && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-center space-x-3 mb-3">
                            <FiMapPin className="w-5 h-5 text-green-600" />
                            <h5 className="font-semibold text-gray-800">Address</h5>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">City:</span>
                              <span className="font-medium">{result.userData.address.city}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">State:</span>
                              <span className="font-medium">{result.userData.address.state}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Country:</span>
                              <span className="font-medium">{result.userData.address.country}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Travel Information */}
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center space-x-3 mb-3">
                          <FiCalendar className="w-5 h-5 text-orange-600" />
                          <h5 className="font-semibold text-gray-800">Travel Information</h5>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Purpose:</span>
                            <span className="font-medium">{result.userData.travelPurpose}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Check-in Date:</span>
                            <span className="font-medium">{result.userData.checkInDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accommodation:</span>
                            <span className="font-medium">{result.userData.accommodation}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Emergency Contact:</span>
                            <span className="font-medium">{result.userData.emergencyContact}</span>
                          </div>
                        </div>
                      </div>

                      {/* Blockchain Info */}
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center space-x-3 mb-3">
                          <FiShield className="w-5 h-5 text-blue-600" />
                          <h5 className="font-semibold text-gray-800">Blockchain Verification</h5>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Blockchain ID:</span>
                            <span className="font-medium font-mono text-xs">{result.digitalId.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Verification Level:</span>
                            <span className="font-medium">{result.digitalId.verificationLevel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Network:</span>
                            <span className="font-medium">{result.digitalId.network}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium text-green-600 capitalize">{result.digitalId.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No scan result yet</p>
                  <p className="text-sm text-gray-500">Scan a QR code to verify tourist identity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedQRScanner;
