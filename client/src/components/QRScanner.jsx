import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCamera, 
  FiX, 
  FiCheckCircle, 
  FiAlertCircle,
  FiRefreshCw 
} from 'react-icons/fi';

const QRScanner = ({ onScan, onClose, isOpen }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const verifyDigitalId = async (digitalIdHash) => {
    try {
      const response = await fetch(`/api/digital-id/verify/${digitalIdHash}`);
      const data = await response.json();
      
      if (data.success) {
        setResult({
          verified: true,
          digitalId: data.digitalId,
          message: 'Digital ID verified successfully!'
        });
        onScan && onScan(data.digitalId);
      } else {
        setResult({
          verified: false,
          message: data.message || 'Digital ID verification failed'
        });
      }
    } catch (error) {
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
            <div className="flex items-center space-x-2">
              <FiAlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
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
            
            {result.verified && result.digitalId && (
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {result.digitalId.userData.fullName}</div>
                <div><strong>ID:</strong> {result.digitalId.id}</div>
                <div><strong>Verification:</strong> {result.digitalId.verificationLevel}</div>
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
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCamera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Camera not active</p>
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
