import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCamera, 
  FiX, 
  FiCheckCircle, 
  FiAlertCircle,
  FiRefreshCw 
} from 'react-icons/fi';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScan, onClose, isOpen }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

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
      setLoading(true);
      setScanning(true);
      setError(null);
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      // Request camera permission explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // Use back camera if available
          } 
        });
        
        // Stop the stream immediately as QrScanner will handle it
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.error('Permission error:', permissionError);
        throw new Error('Camera permission denied. Please allow camera access and try again.');
      }
      
      if (videoRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR Code detected:', result.data);
            verifyDigitalId(result.data);
          },
          {
            onDecodeError: (error) => {
              // Silently handle decode errors - they're normal when no QR is visible
              console.log('QR decode error (normal):', error);
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Use back camera
          }
        );
        
        await qrScannerRef.current.start();
        console.log('QR Scanner started successfully');
        setLoading(false);
      }
    } catch (err) {
      console.error('Camera error:', err);
      let errorMessage = 'Camera access failed. ';
      
      if (err.message.includes('permission')) {
        errorMessage += 'Please allow camera permissions in your browser settings.';
      } else if (err.message.includes('not supported')) {
        errorMessage += 'Camera not supported by this browser.';
      } else if (err.message.includes('NotFoundError')) {
        errorMessage += 'No camera found on this device.';
      } else if (err.message.includes('NotAllowedError')) {
        errorMessage += 'Camera permission denied. Please allow camera access.';
      } else {
        errorMessage += 'Please check your camera settings and try again.';
      }
      
      setError(errorMessage);
      setScanning(false);
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setScanning(false);
    setLoading(false);
  };

  const verifyDigitalId = async (qrData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResult({
          verified: false,
          message: 'Authentication required'
        });
        return;
      }

      let requestBody = {};
      
      // Handle different input types
      if (typeof qrData === 'string') {
        try {
          // Try to parse as JSON first
          const parsedData = JSON.parse(qrData);
          if (parsedData.uid || parsedData.blockchainId) {
            // Send as qrData object (not nested)
            requestBody = { 
              qrData: parsedData,
              uid: parsedData.uid,
              blockchainId: parsedData.blockchainId,
              hash: parsedData.hash
            };
          } else {
            // Treat as blockchain ID or UID
            requestBody = { blockchainId: qrData };
          }
        } catch {
          // Not JSON, treat as blockchain ID or UID
          requestBody = { blockchainId: qrData };
        }
      } else if (typeof qrData === 'object') {
        // Already an object, send all fields
        requestBody = { 
          qrData: qrData,
          uid: qrData.uid,
          blockchainId: qrData.blockchainId,
          hash: qrData.hash
        };
      }

      console.log('🔍 Sending verification request:', requestBody);
      
      const response = await fetch('http://localhost:5000/api/digital-id/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📡 API Response status:', response.status);
      const data = await response.json();
      console.log('📡 API Response data:', data);
      
      if (data.success) {
        setResult({
          verified: true,
          digitalId: data.digitalId,
          userData: data.userData,
          message: 'Digital ID verified successfully!'
        });
        onScan && onScan(data);
      } else {
        setResult({
          verified: false,
          message: data.message || 'Digital ID verification failed'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        verified: false,
        message: 'Error verifying Digital ID'
      });
    }
  };

  const handleManualInput = () => {
    const input = prompt('Enter Digital ID to verify:');
    if (input) {
      verifyDigitalId(input.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scan Digital ID</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <span className="text-red-700 block mb-2">{error}</span>
                <div className="text-sm text-red-600">
                  <p className="mb-2"><strong>To fix this:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Click the camera icon in your browser's address bar</li>
                    <li>Select "Allow" for camera permissions</li>
                    <li>Refresh the page if needed</li>
                    <li>Try clicking "Start Camera" again</li>
                  </ul>
                </div>
                <button
                  onClick={startCamera}
                  className="mt-3 flex items-center space-x-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  <span>Retry Camera Access</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className={`border rounded-lg p-4 mb-4 ${
            result.verified 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {result.verified ? (
                <FiCheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <FiAlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                result.verified ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </span>
            </div>
            
            {result.verified && result.userData && (
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {result.userData.fullName}</div>
                <div><strong>ID:</strong> {result.digitalId.id}</div>
                <div><strong>Verification:</strong> {result.digitalId.verificationLevel}</div>
                <div><strong>Nationality:</strong> {result.userData.nationality}</div>
                <div><strong>Status:</strong> {result.userData.kycStatus}</div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {scanning ? (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-900 rounded-lg"
                autoPlay
                playsInline
                muted
              />
              {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-center text-white">
                    <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Starting camera...</p>
                  </div>
                </div>
              )}
              {scanning && !loading && (
                <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Scanning...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FiCamera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Camera not active</p>
              <p className="text-sm text-gray-500">Click "Start Camera" to begin scanning</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={scanning ? stopCamera : startCamera}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                scanning 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {scanning ? (
                <>
                  <FiX className="w-4 h-4" />
                  <span>Stop</span>
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
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span>Manual Input</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
