import React, { useState, useEffect } from 'react';
import { 
  FiWatch, 
  FiBluetooth, 
  FiActivity, 
  FiHeart, 
  FiMapPin, 
  FiWifi,
  FiSettings,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiTrendingUp,
  FiClock,
  FiZap,
  FiThermometer
} from 'react-icons/fi';

const SmartWatch = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [healthData, setHealthData] = useState({
    heartRate: 72,
    steps: 8547,
    calories: 342,
    distance: 6.2,
    sleepHours: 7.5,
    bodyTemp: 98.6,
    stressLevel: 'Low',
    batteryLevel: 85
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Mock watch brands and models
  const mockDevices = [
    { id: 1, name: 'Apple Watch Series 9', brand: 'Apple', battery: 92, signal: 'strong' },
    { id: 2, name: 'Samsung Galaxy Watch 6', brand: 'Samsung', battery: 78, signal: 'medium' },
    { id: 3, name: 'Fitbit Sense 2', brand: 'Fitbit', battery: 65, signal: 'strong' },
    { id: 4, name: 'Garmin Venu 3', brand: 'Garmin', battery: 88, signal: 'weak' },
    { id: 5, name: 'Amazfit GTR 4', brand: 'Amazfit', battery: 95, signal: 'strong' }
  ];

  const handleScanDevices = () => {
    setIsScanning(true);
    setAvailableDevices([]);
    
    // Simulate Bluetooth scanning
    setTimeout(() => {
      const randomDevices = mockDevices
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 4) + 2);
      setAvailableDevices(randomDevices);
      setIsScanning(false);
    }, 3000);
  };

  const handleConnectDevice = (device) => {
    setSelectedDevice(device);
    setConnectionStatus('connecting');
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
      // Start receiving mock health data
      startHealthDataSimulation();
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSelectedDevice(null);
    setConnectionStatus('disconnected');
  };

  const startHealthDataSimulation = () => {
    // Simulate real-time health data updates
    const interval = setInterval(() => {
      setHealthData(prev => ({
        ...prev,
        heartRate: Math.floor(Math.random() * 30) + 60,
        steps: prev.steps + Math.floor(Math.random() * 10),
        calories: prev.calories + Math.floor(Math.random() * 5),
        batteryLevel: Math.max(prev.batteryLevel - 0.1, 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  };

  const getSignalIcon = (signal) => {
    switch (signal) {
      case 'strong': return '📶';
      case 'medium': return '📶';
      case 'weak': return '📶';
      default: return '📶';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
              <FiWatch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">⌚ SmartWatch Integration</h2>
              <p className="text-gray-600">Connect your smartwatch for real-time health monitoring</p>
            </div>
          </div>
          <div className={`flex items-center space-x-2 ${getConnectionStatusColor()}`}>
            <FiBluetooth className="w-5 h-5" />
            <span className="font-medium capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Connection Status */}
        {isConnected && selectedDevice && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{selectedDevice.name}</p>
                  <p className="text-sm text-green-600">Connected • Battery: {selectedDevice.battery}%</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Device Scanning */}
      {!isConnected && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Available Devices</h3>
            <button
              onClick={handleScanDevices}
              disabled={isScanning}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
            >
              <FiRefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Scan Devices'}</span>
            </button>
          </div>

          {isScanning && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3 text-blue-600">
                <FiBluetooth className="w-6 h-6 animate-pulse" />
                <span>Searching for nearby smartwatches...</span>
              </div>
            </div>
          )}

          {availableDevices.length > 0 && !isScanning && (
            <div className="space-y-3">
              {availableDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <FiWatch className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">{device.name}</p>
                      <p className="text-sm text-gray-600">{device.brand} • Battery: {device.battery}% • {getSignalIcon(device.signal)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnectDevice(device)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}

          {availableDevices.length === 0 && !isScanning && (
            <div className="text-center py-8 text-gray-500">
              <FiBluetooth className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No devices found. Make sure your smartwatch is in pairing mode.</p>
            </div>
          )}
        </div>
      )}

      {/* Health Data Dashboard */}
      {isConnected && (
        <>
          {/* Real-time Health Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <FiHeart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-600 font-medium">Heart Rate</p>
                  <p className="text-2xl font-bold text-red-700">{healthData.heartRate} BPM</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FiActivity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Steps Today</p>
                  <p className="text-2xl font-bold text-blue-700">{healthData.steps.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <FiZap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Calories</p>
                  <p className="text-2xl font-bold text-orange-700">{healthData.calories}</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <FiMapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Distance</p>
                  <p className="text-2xl font-bold text-green-700">{healthData.distance} km</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Health Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <FiClock className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">Sleep Duration</span>
                  </div>
                  <span className="font-semibold text-gray-800">{healthData.sleepHours} hours</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <FiThermometer className="w-5 h-5 text-red-600" />
                    <span className="text-gray-700">Body Temperature</span>
                  </div>
                  <span className="font-semibold text-gray-800">{healthData.bodyTemp}°F</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <FiTrendingUp className="w-5 h-5 text-yellow-600" />
                    <span className="text-gray-700">Stress Level</span>
                  </div>
                  <span className="font-semibold text-green-600">{healthData.stressLevel}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <FiZap className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Watch Battery</span>
                  </div>
                  <span className="font-semibold text-gray-800">{Math.round(healthData.batteryLevel)}%</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Safety Features</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiCheck className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Fall Detection</span>
                  </div>
                  <p className="text-sm text-green-700">Automatically detects hard falls and can call emergency services</p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiMapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Location Tracking</span>
                  </div>
                  <p className="text-sm text-blue-700">Real-time GPS location sharing with emergency contacts</p>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiAlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">SOS Emergency</span>
                  </div>
                  <p className="text-sm text-red-700">Press and hold crown to send emergency alert with location</p>
                </div>
              </div>
            </div>
          </div>

          {/* API Integration Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">API Integration Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <FiCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Health Data API</p>
                  <p className="text-sm text-green-600">Connected & Syncing</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <FiCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Location Services</p>
                  <p className="text-sm text-green-600">Active</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <FiSettings className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Emergency API</p>
                  <p className="text-sm text-yellow-600">Ready for Backend</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SmartWatch;
