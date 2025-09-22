import React, { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, 
  FiPhone, 
  FiMapPin, 
  FiShield,
  FiX,
  FiCheckCircle
} from 'react-icons/fi';
import LocationTracker from './LocationTracker';

const EmergencyLocationTracker = ({ onClose, emergencyType = 'general' }) => {
  const [isActive, setIsActive] = useState(false);
  const [emergencyId, setEmergencyId] = useState(null);
  const [responders, setResponders] = useState([]);
  const [countdown, setCountdown] = useState(10);
  const [autoActivated, setAutoActivated] = useState(false);

  // Auto-activate emergency tracking after countdown
  useEffect(() => {
    if (countdown > 0 && !isActive) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isActive) {
      activateEmergency();
      setAutoActivated(true);
    }
  }, [countdown, isActive]);

  // Fetch nearby responders when emergency is active
  useEffect(() => {
    if (isActive && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        fetchNearbyResponders(position.coords.latitude, position.coords.longitude);
      });
    }
  }, [isActive]);

  const activateEmergency = async () => {
    setIsActive(true);
    
    try {
      // Generate emergency ID
      const id = `EMG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setEmergencyId(id);

      // Send emergency alert to backend
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/emergency/alert`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            emergencyId: id,
            type: emergencyType,
            status: 'active',
            autoActivated
          })
        });
      }

      console.log('🚨 Emergency activated:', { id, type: emergencyType, autoActivated });
    } catch (error) {
      console.error('Error activating emergency:', error);
    }
  };

  const cancelEmergency = () => {
    setIsActive(false);
    setCountdown(0);
    if (onClose) onClose();
  };

  const fetchNearbyResponders = async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/location/nearby?lat=${lat}&lng=${lng}&radius=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResponders(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching nearby responders:', error);
    }
  };

  const handleLocationUpdate = (locationData) => {
    console.log('Emergency location updated:', locationData);
    // Update responders based on new location
    fetchNearbyResponders(locationData.lat, locationData.lng);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <FiAlertTriangle className="text-red-600 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-800">Emergency Alert</h2>
                <p className="text-sm text-red-600">
                  {emergencyType.charAt(0).toUpperCase() + emergencyType.slice(1)} Emergency
                </p>
              </div>
            </div>
            
            {!isActive && (
              <button
                onClick={cancelEmergency}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            )}
          </div>
        </div>

        {/* Countdown or Active Status */}
        <div className="p-6">
          {!isActive ? (
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-red-600 mb-2">{countdown}</div>
              <p className="text-gray-600 mb-4">
                Emergency services will be contacted automatically
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={activateEmergency}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold"
                >
                  Activate Now
                </button>
                <button
                  onClick={cancelEmergency}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-red-800">Emergency Active</span>
                {emergencyId && (
                  <span className="text-xs text-gray-500">ID: {emergencyId.slice(-8)}</span>
                )}
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <FiCheckCircle className="text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Emergency Services Notified</p>
                    <p className="text-sm text-green-600">
                      Your location is being tracked and shared with responders
                    </p>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Emergency Contacts</h3>
                <div className="space-y-2">
                  <button className="flex items-center space-x-2 w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    <FiPhone />
                    <span>Call 911</span>
                  </button>
                  <button className="flex items-center space-x-2 w-full p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg">
                    <FiPhone />
                    <span>Call Emergency Contact</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Location Tracker */}
          {isActive && (
            <div className="mb-6">
              <LocationTracker 
                onLocationUpdate={handleLocationUpdate}
                emergencyMode={true}
              />
            </div>
          )}

          {/* Nearby Responders */}
          {isActive && responders.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Nearby Emergency Activity</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {responders.slice(0, 3).map((responder, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <FiMapPin className="text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{responder.title}</p>
                      <p className="text-xs text-gray-600">
                        {responder.distance}km away • {responder.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Safety Instructions</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Stay calm and in a safe location if possible</li>
              <li>• Keep your phone charged and accessible</li>
              <li>• Follow instructions from emergency responders</li>
              <li>• Do not leave your current location unless instructed</li>
            </ul>
          </div>

          {/* Close Button for Active Emergency */}
          {isActive && (
            <button
              onClick={() => {
                setIsActive(false);
                if (onClose) onClose();
              }}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Close (Emergency Remains Active)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyLocationTracker;
