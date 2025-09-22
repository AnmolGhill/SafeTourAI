import React, { useState, useRef, useEffect } from 'react';
import { FiCamera, FiUpload, FiCheck, FiX, FiUser, FiShield, FiEye, FiEdit } from 'react-icons/fi';
import { QRCodeSVG } from "qrcode.react";
import QrReader from 'qrcode-reader';
import jsQR from 'jsqr';
import QRScanner from '../../components/QRScanner';

// Get API base URL from environment
const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api`;

const DigitalIdScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQrData, setManualQrData] = useState('');
  const fileInputRef = useRef(null);

  const handleScan = () => {
    setScannerOpen(true);
  };

  const handleScanResult = (verificationData) => {
    if (verificationData.success) {
      const newScanResult = {
        name: verificationData.userData.fullName,
        idNumber: verificationData.digitalId.id,
        nationality: verificationData.userData.nationality,
        dateOfBirth: verificationData.userData.dateOfBirth,
        verified: true,
        emergencyContact: verificationData.userData.emergencyContact,
        kycStatus: verificationData.userData.kycStatus,
        verificationLevel: verificationData.digitalId.verificationLevel,
        blockchainId: verificationData.userData.blockchainId,
        verificationTime: new Date().toLocaleTimeString()
      };
      
      setScanResult(newScanResult);
      
      // Add to scan history
      setScanHistory(prev => [{
        id: Date.now(),
        name: newScanResult.name,
        idNumber: newScanResult.idNumber,
        time: newScanResult.verificationTime,
        status: 'verified'
      }, ...prev.slice(0, 9)]); // Keep last 10 scans
    }
    setScannerOpen(false);
  };

  const readQRCode = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        console.log('File read successfully, starting QR decode...');

        try {
          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;

            if (!width || !height) {
              reject(new Error("Invalid image dimensions. Please ensure the image is valid."));
              return;
            }

            console.log("Image loaded successfully:", { width, height });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Failed to create canvas context."));
              return;
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            let imageData;
            try {
              imageData = ctx.getImageData(0, 0, width, height);
            } catch (err) {
              reject(new Error("Failed to extract image data. The image might be corrupted or too large."));
              return;
            }

            // Try multiple QR decoding approaches
            console.log("Attempting QR decode with imageData:", { width, height, dataLength: imageData.data.length });
            
            // Try jsQR with multiple configurations for better reliability
            try {
              console.log("Trying jsQR with multiple configurations...");
              
              // Try 1: Basic jsQR
              let code = jsQR(imageData.data, width, height);
              if (code && code.data) {
                console.log("QR Code decoded with jsQR (basic):", code.data);
                processQRResult(code.data, resolve, reject);
                return;
              }
              
              // Try 2: jsQR with inverted image data
              const invertedData = new Uint8ClampedArray(imageData.data);
              for (let i = 0; i < invertedData.length; i += 4) {
                invertedData[i] = 255 - invertedData[i];
                invertedData[i + 1] = 255 - invertedData[i + 1];
                invertedData[i + 2] = 255 - invertedData[i + 2];
              }
              
              code = jsQR(invertedData, width, height);
              if (code && code.data) {
                console.log("QR Code decoded with jsQR (inverted):", code.data);
                processQRResult(code.data, resolve, reject);
                return;
              }
              
              // Try 3: jsQR with high contrast
              const contrastData = new Uint8ClampedArray(imageData.data);
              for (let i = 0; i < contrastData.length; i += 4) {
                const gray = contrastData[i] * 0.299 + contrastData[i + 1] * 0.587 + contrastData[i + 2] * 0.114;
                const contrast = gray > 128 ? 255 : 0;
                contrastData[i] = contrast;
                contrastData[i + 1] = contrast;
                contrastData[i + 2] = contrast;
              }
              
              code = jsQR(contrastData, width, height);
              if (code && code.data) {
                console.log("QR Code decoded with jsQR (high contrast):", code.data);
                processQRResult(code.data, resolve, reject);
                return;
              }
              
            } catch (jsqrError) {
              console.error("jsQR error:", jsqrError);
            }
            
            // Skip qrcode-reader due to alignment pattern issues, go directly to alternative processing
            console.log("jsQR failed, skipping qrcode-reader due to reliability issues...");
            console.log("Trying alternative image processing...");
            tryAlternativeDecoding(e.target.result, resolve, reject);
          };

          img.onerror = () => {
            reject(new Error("Failed to load image. Please ensure the file is a valid PNG/JPG."));
          };

          img.src = e.target.result;
        } catch (error) {
          console.error("Image processing error:", error);
          reject(new Error("Failed to process the image."));
        }
      };
      
      reader.onerror = (error) => {
        console.error('File read error:', error);
        reject(new Error('Failed to read the file.'));
      };
      
      // Start reading the file as data URL
      reader.readAsDataURL(file);
    });
  };

  const tryAlternativeDecoding = (dataUrl, resolve, reject) => {
    console.log('Trying alternative QR decoding with image preprocessing...');
    
    try {
      // Create a new image for preprocessing
      const img = new Image();
      img.onload = () => {
        // Create canvas with higher contrast processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Try multiple preprocessing approaches
        const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Approach 1: High contrast black/white
        const contrastData = new Uint8ClampedArray(originalImageData.data);
        for (let i = 0; i < contrastData.length; i += 4) {
          const gray = contrastData[i] * 0.299 + contrastData[i + 1] * 0.587 + contrastData[i + 2] * 0.114;
          const contrast = gray > 128 ? 255 : 0;
          contrastData[i] = contrast;
          contrastData[i + 1] = contrast;
          contrastData[i + 2] = contrast;
        }
        
        try {
          const code1 = jsQR(contrastData, canvas.width, canvas.height);
          if (code1 && code1.data) {
            console.log("QR Code decoded with high contrast:", code1.data);
            processQRResult(code1.data, resolve, reject);
            return;
          }
        } catch (error) {
          console.error("High contrast jsQR error:", error);
        }
        
        // Approach 2: Inverted colors
        const invertedData = new Uint8ClampedArray(originalImageData.data);
        for (let i = 0; i < invertedData.length; i += 4) {
          invertedData[i] = 255 - invertedData[i];       // red
          invertedData[i + 1] = 255 - invertedData[i + 1]; // green
          invertedData[i + 2] = 255 - invertedData[i + 2]; // blue
        }
        
        try {
          const code2 = jsQR(invertedData, canvas.width, canvas.height);
          if (code2 && code2.data) {
            console.log("QR Code decoded with inversion:", code2.data);
            processQRResult(code2.data, resolve, reject);
            return;
          }
        } catch (error) {
          console.error("Inverted jsQR error:", error);
        }
        
        // Approach 3: Try with different threshold
        const thresholdData = new Uint8ClampedArray(originalImageData.data);
        for (let i = 0; i < thresholdData.length; i += 4) {
          const gray = thresholdData[i] * 0.299 + thresholdData[i + 1] * 0.587 + thresholdData[i + 2] * 0.114;
          const threshold = gray > 100 ? 255 : 0; // Lower threshold
          thresholdData[i] = threshold;
          thresholdData[i + 1] = threshold;
          thresholdData[i + 2] = threshold;
        }
        
        try {
          const code3 = jsQR(thresholdData, canvas.width, canvas.height);
          if (code3 && code3.data) {
            console.log("QR Code decoded with lower threshold:", code3.data);
            processQRResult(code3.data, resolve, reject);
            return;
          }
        } catch (error) {
          console.error("Threshold jsQR error:", error);
        }
        
        // If still no success, reject
        reject(new Error('Unable to read QR code from the uploaded image. Please ensure the image is clear and contains a valid QR code.'));
      };
      
      img.onerror = () => {
        reject(new Error('Failed to process image for alternative decoding.'));
      };
      
      img.src = dataUrl;
    } catch (error) {
      console.error('Alternative decoding error:', error);
      reject(new Error('Unable to read QR code from the uploaded image. Please ensure the image is clear and contains a valid QR code.'));
    }
  };

  const processQRResult = (resultData, resolve, reject) => {
    try {
      // First try to parse as JSON
      let qrData;
      try {
        qrData = JSON.parse(resultData);
      } catch (e) {
        // If not JSON, it might be a string representation
        qrData = resultData;
        // Try to extract JSON from string if it's embedded
        const jsonMatch = qrData.match(/\{.*\}/s);
        if (jsonMatch) {
          qrData = JSON.parse(jsonMatch[0]);
        }
      }
      
      console.log('Parsed QR data:', qrData);
      
      // Handle different QR code formats
      let verificationData = {};
      
      // If it's a string with the format we expect
      if (typeof qrData === 'string' && qrData.includes('SafeTourDigitalID')) {
        verificationData = {
          type: 'SafeTourDigitalID',
          ...JSON.parse(qrData)
        };
      } 
      // If it's already an object
      else if (typeof qrData === 'object') {
        verificationData = { ...qrData };
      }
      
      // Validate required fields
      if (!verificationData.uid && !verificationData.blockchainId) {
        throw new Error('QR code does not contain required identification data');
      }
      
      console.log('Extracted verification data:', verificationData);
      resolve(verificationData);
      
    } catch (parseError) {
      console.error('QR Code parse error:', parseError);
      reject(new Error('Invalid QR code format. Please scan a valid SafeTour Digital ID.'));
    }
  };

  const testApiConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/digital-id/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrData: '{"type":"SafeTourDigitalID","uid":"Xful3qyptCbJbC4S4Udu43FKv8X2"}',
          uid: 'Xful3qyptCbJbC4S4Udu43FKv8X2',
          type: 'SafeTourDigitalID'
        })
      });
      
      console.log('API Connection Test:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      const data = await response.json();
      console.log('API Test Response:', data);
      
      // API is working if we get any response (even 404 user not found means API is accessible)
      return response.status !== 0 && response.status < 500;
    } catch (error) {
      console.error('API Connection Test Failed:', error);
      return false;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    
    // Test API connection first
    console.log('Testing API connection...');
    const apiWorking = await testApiConnection();
    console.log('API Connection Status:', apiWorking ? 'Working' : 'Failed');
    
    try {
      // Read and decode the QR code
      console.log('Reading QR code from file...');
      const qrData = await readQRCode(file);
      console.log('QR code data extracted:', qrData);
      
      // Get the auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Format the request body according to the backend's expected format
      const requestBody = {
        qrData: JSON.stringify(qrData), // Send the full QR data as a string
        uid: qrData.uid || qrData.userId, // Handle both uid and userId
        blockchainId: qrData.blockchainId || qrData.address, // Handle different field names
        hash: qrData.hash,
        type: qrData.type || 'SafeTourDigitalID'
      };
      
      // Remove undefined values
      Object.keys(requestBody).forEach(key => requestBody[key] === undefined && delete requestBody[key]);
      
      console.log('Sending verification request to API...', {
        ...requestBody,
        qrData: requestBody.qrData ? '[...]' : undefined // Don't log full qrData to keep console clean
      });
      
      // Call the API to verify the QR code data
      let response;
      try {
        response = await fetch('http://localhost:5000/api/digital-id/verify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
      } catch (fetchError) {
        console.error('Network error during API call:', fetchError);
        throw new Error('Network error. Please check your connection and try again.');
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid response from server. Please try again.');
      }
      
      console.log('API Response:', { status: response.status, data });
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.statusText}`);
      }

      // Process successful verification
      if (data.success && data.userData) {
        const newScanResult = {
          name: data.userData.fullName,
          idNumber: data.digitalId?.id || 'N/A',
          nationality: data.userData.nationality || 'Not specified',
          dateOfBirth: data.userData.dateOfBirth || 'Not specified',
          kycStatus: data.userData.kycStatus || 'Not specified',
          verificationLevel: data.digitalId?.verificationLevel || 'Not specified',
          emergencyContact: data.userData.emergencyContact || 'Not provided',
          blockchainId: data.userData.blockchainId || 'N/A',
          verificationTime: new Date().toLocaleTimeString()
        };

        setScanResult(newScanResult);
        
        // Add to scan history
        setScanHistory(prev => [{
          id: Date.now(),
          name: newScanResult.name,
          idNumber: newScanResult.idNumber,
          time: newScanResult.verificationTime,
          status: 'verified'
        }, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('QR verification error:', error);
      // Show error to user
      setScanResult({
        error: true,
        message: error.message || 'Failed to verify QR code. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualQrData.trim()) return;
    
    setLoading(true);
    try {
      let qrData;
      try {
        qrData = JSON.parse(manualQrData);
      } catch (e) {
        throw new Error('Invalid JSON format. Please enter valid QR data.');
      }
      
      console.log('Manual QR data entered:', qrData);
      
      // Get the auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Format the request body
      const requestBody = {
        qrData: JSON.stringify(qrData),
        uid: qrData.uid || qrData.userId,
        blockchainId: qrData.blockchainId || qrData.address,
        hash: qrData.hash,
        type: qrData.type || 'SafeTourDigitalID'
      };
      
      // Remove undefined values
      Object.keys(requestBody).forEach(key => requestBody[key] === undefined && delete requestBody[key]);
      
      // Call the API
      const response = await fetch(`${API_BASE_URL}/digital-id/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.statusText}`);
      }

      // Process successful verification
      if (data.success && data.userData) {
        const newScanResult = {
          name: data.userData.fullName,
          idNumber: data.digitalId?.id || data.userData.blockchainId,
          nationality: data.userData.nationality,
          dateOfBirth: data.userData.dateOfBirth,
          verified: true,
          emergencyContact: data.userData.emergencyContact,
          kycStatus: data.userData.kycStatus,
          verificationLevel: data.digitalId?.verificationLevel || 'verified',
          blockchainId: data.userData.blockchainId,
          verificationTime: new Date().toLocaleTimeString()
        };

        setScanResult(newScanResult);
        
        // Add to scan history
        setScanHistory(prev => [{
          id: Date.now(),
          name: newScanResult.name,
          idNumber: newScanResult.idNumber,
          time: newScanResult.verificationTime,
          status: 'verified'
        }, ...prev.slice(0, 9)]);
        
        setShowManualInput(false);
        setManualQrData('');
      }
    } catch (error) {
      console.error('Manual QR verification error:', error);
      setScanResult({
        error: true,
        message: error.message || 'Failed to verify QR data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Digital ID Scanner</h2>
        <p className="text-gray-600">Scan tourist digital IDs to verify identity and access profiles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Scanner Interface */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">ID Scanner</h3>
          
          <div className="space-y-4">
            {/* Camera Scan Button */}
            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center space-x-2 py-4"
            >
              <FiCamera className="w-5 h-5" />
              <span>Start QR Scanner</span>
            </button>

            {/* File Upload */}
            <div className="text-center">
              <span className="text-gray-500">or</span>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full btn btn-secondary flex items-center justify-center space-x-2 py-4"
              >
                <FiUpload className="w-5 h-5" />
                <span>Upload QR Image</span>
              </button>
              
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                disabled={loading}
                className="w-full btn btn-primary flex items-center justify-center space-x-2 py-4"
              >
                <FiEdit className="w-5 h-5" />
                <span>Manual QR Data Input</span>
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Manual QR Data Input */}
            {showManualInput && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Enter QR Data Manually</h4>
                <textarea
                  value={manualQrData}
                  onChange={(e) => setManualQrData(e.target.value)}
                  placeholder='{"type":"SafeTourDigitalID","uid":"user_id_here","blockchainId":"blockchain_address"}'
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 text-sm font-mono"
                  disabled={loading}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleManualSubmit}
                    disabled={loading || !manualQrData.trim()}
                    className="btn btn-primary flex-1 disabled:opacity-50"
                  >
                    Verify QR Data
                  </button>
                  <button
                    onClick={() => {
                      setShowManualInput(false);
                      setManualQrData('');
                    }}
                    disabled={loading}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing QR Code...</p>
              </div>
            )}
          </div>
        </div>

        {/* Scan Result */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Scan Result</h3>
          
          {scanResult ? (
            <div className="space-y-4">
              {scanResult.error ? (
                <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                  <FiX className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Verification Failed</p>
                    <p className="text-sm text-red-600">{scanResult.message}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <FiCheck className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">ID Verified Successfully</p>
                    <p className="text-sm text-green-600">Tourist profile found and validated</p>
                  </div>
                </div>
              )}

              {!scanResult.error && (
                <>
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
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="font-semibold">{scanResult.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">KYC Status:</span>
                      <span className="font-semibold text-green-600">{scanResult.kycStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verification Level:</span>
                      <span className="font-semibold">{scanResult.verificationLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emergency Contact:</span>
                      <span className="font-semibold">{scanResult.emergencyContact}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 btn btn-primary flex items-center justify-center space-x-2">
                      <FiEye className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                    <button className="flex-1 btn btn-secondary">
                      Export Data
                    </button>
                  </div>
                </>
              )}
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

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={scannerOpen}
        onScan={handleScanResult}
        onClose={() => setScannerOpen(false)}
      />

      {/* Recent Scans */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Scans</h3>
        
        <div className="space-y-3">
          {scanHistory.length > 0 ? (
            scanHistory.map((scan) => (
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
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent scans</p>
              <p className="text-sm">Scan history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalIdScanner;
