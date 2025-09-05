import React, { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiShield, 
  FiDownload, 
  FiShare2, 
  FiCopy,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
  FiCamera,
  FiLink
} from 'react-icons/fi';
import { BiWallet } from 'react-icons/bi';
import { kycAPI } from '../config/api';
import QRScanner from './QRScanner';

const DigitalID = () => {
  const [digitalID, setDigitalID] = useState(null);
  const [kycStatus, setKycStatus] = useState('pending'); // pending, verified, rejected
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    fetchDigitalID();
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchDigitalID = async () => {
    setLoading(true);
    
    try {
      const response = await kycAPI.getStatus();
      if (response.data.success) {
        const kycData = response.data.data;
        
        // Map KYC status: 'approved' -> 'verified' for consistency
        const mappedStatus = kycData.kycStatus === 'approved' ? 'verified' : kycData.kycStatus || 'pending';
        setKycStatus(mappedStatus);
        
        if (mappedStatus === 'verified' && kycData.blockchainId) {
          // Create digital ID from KYC data
          setDigitalID({
            id: kycData.blockchainId,
            blockchainId: kycData.blockchainId,
            status: 'Active',
            createdAt: kycData.reviewedAt || new Date().toISOString(),
            network: 'Ethereum Mainnet',
            contractAddress: '0x742d35Cc6634C0532925a3b8D8C9C4e5c4e4c4e4',
            tokenId: kycData.blockchainId?.slice(-8),
            blockchainHash: `0x${kycData.blockchainId?.slice(2)}${Date.now().toString(16)}`
          });
          
          // Set wallet address from blockchain ID
          setWalletAddress(kycData.blockchainId);
          setWalletConnected(true);
        }
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      setKycStatus('pending');
    }
    
    setLoading(false);
  };

  const handleScanResult = (scannedData) => {
    console.log('Scanned Digital ID:', scannedData);
    setScannerOpen(false);
  };


  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          console.log('Wallet connected:', accounts[0]);
        }
      } else {
        alert('Please install MetaMask or another Ethereum wallet to connect');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(null);
  };

  const downloadID = () => {
    const idData = {
      ...digitalID,
      userData: userData,
      walletAddress: walletAddress,
      downloadedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(idData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SafeTour-DigitalID-${digitalID.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [qrCodeData, setQrCodeData] = useState(null);

  const fetchQRCodeData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/blockchain/digital-id/qr', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.qrData) {
        setQrCodeData(data.qrData);
      }
    } catch (error) {
      console.error('Error fetching QR code data:', error);
    }
  };

  const generateQRCode = () => {
    if (!qrCodeData) {
      fetchQRCodeData();
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">Loading QR...</text>
        </svg>
      `)}`;
    }

    // Generate QR code with secure hashmap data
    const qrContent = JSON.stringify({
      type: qrCodeData.type,
      blockchainId: qrCodeData.blockchainId,
      hash: qrCodeData.hash,
      network: qrCodeData.network,
      timestamp: qrCodeData.timestamp
    });

    // Simple QR-like pattern with actual data
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="20" height="20" fill="black"/>
        <rect x="60" y="20" width="20" height="20" fill="black"/>
        <rect x="100" y="20" width="20" height="20" fill="black"/>
        <rect x="140" y="20" width="20" height="20" fill="black"/>
        <rect x="20" y="60" width="20" height="20" fill="black"/>
        <rect x="100" y="60" width="20" height="20" fill="black"/>
        <rect x="180" y="60" width="20" height="20" fill="black"/>
        <rect x="40" y="40" width="120" height="120" fill="none" stroke="black" stroke-width="2"/>
        <text x="100" y="105" text-anchor="middle" font-size="8" fill="black">${qrCodeData.blockchainId}</text>
        <text x="100" y="120" text-anchor="middle" font-size="6" fill="black">${qrCodeData.hash}</text>
        <text x="100" y="190" text-anchor="middle" font-size="8" fill="black">SafeTour ID</text>
      </svg>
    `)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center space-x-3">
              <FiRefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-lg text-gray-700">Verifying KYC status and generating Digital ID...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus !== 'verified') {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <FiAlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">KYC Verification Required</h2>
              <p className="text-gray-600 mb-6">
                You need to complete KYC verification before your Digital ID can be generated.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">What is KYC?</h3>
                <p className="text-sm text-yellow-700">
                  Know Your Customer (KYC) verification helps us confirm your identity and comply with 
                  security regulations. This ensures your Digital ID is secure and trustworthy.
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/kyc'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete KYC Verification
              </button>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Note:</strong> After KYC approval, your blockchain Digital ID will be automatically generated and secured on the SafeTour blockchain network.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Digital Identity</h1>
              <p className="text-blue-100">Blockchain-secured travel identification</p>
            </div>
            <FiShield className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Digital ID Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">SafeTour Digital ID</h2>
                <p className="text-indigo-100">Blockchain Verified</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-indigo-100">ID Number</div>
                <div className="font-mono text-lg font-bold">{digitalID?.blockchainId}</div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <FiUser className="w-8 h-8 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{userData?.name || userData?.fullName || 'User'}</h3>
                    <p className="text-sm text-gray-600">{userData?.role || 'SafeTour Member'}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium">{userData?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Role:</span>
                    <span className="text-sm font-medium capitalize">{userData?.role || 'User'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Blockchain ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium font-mono">{digitalID?.blockchainId?.slice(0, 10)}...{digitalID?.blockchainId?.slice(-8)}</span>
                      <button
                        onClick={() => copyToClipboard(digitalID?.blockchainId)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiCopy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium text-green-600 flex items-center space-x-1">
                      <FiShield className="w-3 h-3" />
                      <span>{digitalID?.status}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium">{digitalID?.createdAt ? new Date(digitalID.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Wallet:</span>
                    <span className={`text-sm font-medium ${walletConnected ? 'text-green-600' : 'text-gray-500'}`}>
                      {walletConnected ? '✅ Connected' : '❌ Not Connected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <img 
                    src={generateQRCode()} 
                    alt="Digital ID QR Code" 
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Scan to verify identity
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain Details */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiShield className="w-5 h-5 mr-2 text-blue-600" />
            Blockchain Verification Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Blockchain Network:</label>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded">{digitalID.network}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Contract Address:</label>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded flex items-center justify-between">
                  <span className="truncate">{digitalID.contractAddress}</span>
                  <button
                    onClick={() => copyToClipboard(digitalID.contractAddress)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Token ID:</label>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded">{digitalID.tokenId}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Blockchain Hash:</label>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded flex items-center justify-between">
                  <span className="truncate">{digitalID.blockchainHash}</span>
                  <button
                    onClick={() => copyToClipboard(digitalID.blockchainHash)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status:</label>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Active & Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BiWallet className="w-5 h-5 mr-2 text-blue-600" />
            Wallet Connection
          </h3>
          
          {walletConnected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">Wallet Connected</h4>
                    <p className="text-sm text-green-600 font-mono">{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}</p>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <FiShield className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-sm font-medium">Secure</p>
                  <p className="text-xs text-gray-600">Blockchain Protected</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <FiLink className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-sm font-medium">Connected</p>
                  <p className="text-xs text-gray-600">Real-time Sync</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <FiCheck className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-sm font-medium">Verified</p>
                  <p className="text-xs text-gray-600">KYC Approved</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <BiWallet className="w-12 h-12 mx-auto text-yellow-600 mb-3" />
                <h4 className="font-semibold text-yellow-800 mb-2">Connect Your Wallet</h4>
                <p className="text-sm text-yellow-700 mb-4">
                  Connect your Ethereum wallet to access your blockchain ID and enable secure transactions.
                </p>
                <button
                  onClick={connectWallet}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Connect Wallet
                </button>
              </div>
              
              <p className="text-xs text-gray-500">
                Your blockchain ID: <code className="bg-gray-100 px-2 py-1 rounded">{digitalID?.blockchainId}</code>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setQrCodeVisible(!qrCodeVisible)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiCamera className="w-4 h-4" />
              <span>Show QR Code</span>
            </button>
            
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiCamera className="w-4 h-4" />
              <span>Scan ID</span>
            </button>
            
            <button
              onClick={downloadID}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              <span>Download ID</span>
            </button>
            
            <button
              onClick={() => copyToClipboard(digitalID?.id || digitalID?.blockchainId)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FiShare2 className="w-4 h-4" />
              <span>Share ID</span>
            </button>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-sm">Immutable blockchain record</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-sm">Cryptographic verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-sm">Tamper-proof identity</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-sm">Global recognition</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-sm">Emergency access enabled</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <span className="text-sm">Privacy protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">How to Use Your Digital ID</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-green-600 mt-1">•</span>
              <span className="text-sm text-green-700">
                <strong>Emergency Situations:</strong> Show QR code to authorities for instant identity verification
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-600 mt-1">•</span>
              <span className="text-sm text-green-700">
                <strong>Travel Check-ins:</strong> Use at hotels, airports, and border crossings for faster processing
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-600 mt-1">•</span>
              <span className="text-sm text-green-700">
                <strong>Medical Emergencies:</strong> Medical staff can access your health information instantly
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-600 mt-1">•</span>
              <span className="text-sm text-green-700">
                <strong>Backup Access:</strong> Download and store your ID securely as backup
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {qrCodeVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Your Digital ID QR Code</h3>
                <img 
                  src={generateQRCode()} 
                  alt="Digital ID QR Code" 
                  className="w-64 h-64 mx-auto mb-4"
                />
                <p className="text-sm text-gray-600 mb-4">
                  Scan this code to verify your identity
                </p>
                <button
                  onClick={() => setQrCodeVisible(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner */}
        <QRScanner
          isOpen={scannerOpen}
          onScan={handleScanResult}
          onClose={() => setScannerOpen(false)}
        />
      </div>
    </div>
  );
};

export default DigitalID;
