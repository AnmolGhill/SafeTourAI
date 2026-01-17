import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiMapPin, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiX,
  FiSettings,
  FiShield
} from 'react-icons/fi';

const LocationTracker = ({ onLocationUpdate, emergencyMode = false }) => {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [permission, setPermission] = useState('prompt');
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  // Check geolocation permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermission(result.state);
        result.addEventListener('change', () => {
          setPermission(result.state);
        });
      });
    }
  }, []);

  // Geolocation options - more permissive for better success
  const geoOptions = {
    enableHighAccuracy: false, // Start with network-based for faster response
    timeout: 30000, // Longer timeout
    maximumAge: 300000 // 5 minutes cache to avoid repeated permission requests
  };

  // High accuracy options for second attempt
  const highAccuracyOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 60000 // 1 minute cache
  };

  // Success callback for geolocation
  const handleLocationSuccess = useCallback((position) => {
    const { latitude, longitude, accuracy: posAccuracy } = position.coords;
    
    const locationData = {
      lat: latitude,
      lng: longitude,
      accuracy: posAccuracy,
      timestamp: new Date(position.timestamp)
    };

    setLocation(locationData);
    setAccuracy(posAccuracy);
    setError(null);

    // Call parent callback if provided
    if (onLocationUpdate) {
      onLocationUpdate(locationData);
    }

    // Auto-track location for emergency mode
    if (emergencyMode) {
      trackLocation(locationData);
    }
  }, [onLocationUpdate, emergencyMode]);

  // Error callback for geolocation
  const handleLocationError = useCallback((error) => {
    let errorMessage = 'Location access failed';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        setPermission('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
      default:
        errorMessage = 'Unknown location error';
        break;
    }

    setError(errorMessage);
    setTracking(false);
    console.error('Geolocation error:', error);
  }, []);

  // Send location to backend
  const trackLocation = async (locationData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const endpoint = emergencyMode ? '/api/location/emergency' : '/api/location/track';
      const payload = {
        lat: locationData.lat,
        lng: locationData.lng,
        activityType: emergencyMode ? 'emergency' : 'location',
        description: emergencyMode 
          ? 'Emergency location tracking activated'
          : 'Location update',
        timestamp: locationData.timestamp.toISOString()
      };

      if (emergencyMode) {
        payload.emergencyType = 'general';
      }

      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to track location: ${response.status}`);
      }

      const data = await response.json();
      console.log('Location tracked successfully:', data);

    } catch (error) {
      console.error('Error tracking location:', error);
    }
  };

  // Start tracking location with improved permission handling
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    // Check if permission is already denied
    if (permission === 'denied') {
      setError('Location access denied. Please refresh the page and allow location access when prompted.');
      return;
    }

    setTracking(true);
    setError(null);

    console.log('🗺️ Starting location tracking...');

    // First attempt: Network-based location (faster, less intrusive)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Network location obtained:', position.coords.accuracy + 'm accuracy');
        setPermission('granted');
        handleLocationSuccess(position);
        
        // Try to get more accurate location in background
        navigator.geolocation.getCurrentPosition(
          (accuratePosition) => {
            console.log('✅ High-accuracy location obtained:', accuratePosition.coords.accuracy + 'm accuracy');
            handleLocationSuccess(accuratePosition);
            
            // Start continuous tracking with the better position
            const id = navigator.geolocation.watchPosition(
              handleLocationSuccess,
              (watchError) => {
                console.warn('Watch position error:', watchError);
                // Don't stop tracking on watch errors, just log them
              },
              highAccuracyOptions
            );
            setWatchId(id);
          },
          (accurateError) => {
            console.warn('High-accuracy location failed, using network location:', accurateError);
            // Still start watching with network-based location
            const id = navigator.geolocation.watchPosition(
              handleLocationSuccess,
              (watchError) => {
                console.warn('Watch position error:', watchError);
              },
              geoOptions
            );
            setWatchId(id);
          },
          highAccuracyOptions
        );
      },
      (error) => {
        console.error('Initial location request failed:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setPermission('denied');
          setError('Location access denied. Please refresh the page and click "Allow" when prompted for location access.');
        } else if (error.code === error.TIMEOUT) {
          setError('Location request timed out. Please check your internet connection and try again.');
        } else {
          setError('Unable to get your location. Please check your GPS/network settings.');
        }
        handleLocationError(error);
      },
      geoOptions
    );
  }, [handleLocationSuccess, handleLocationError, geoOptions, highAccuracyOptions, permission]);

  // Stop location tracking
  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTracking(false);
  };

  // Request location permission
  const requestPermission = () => {
    startTracking();
  };

  // Get accuracy status
  const getAccuracyStatus = () => {
    if (!accuracy) return { color: 'gray', text: 'Unknown' };
    if (accuracy <= 10) return { color: 'green', text: 'High' };
    if (accuracy <= 50) return { color: 'yellow', text: 'Medium' };
    return { color: 'red', text: 'Low' };
  };

  const accuracyStatus = getAccuracyStatus();

  return (
    <div className={`p-4 rounded-lg border ${emergencyMode ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {emergencyMode ? (
            <FiAlertTriangle className="text-red-600 text-xl" />
          ) : (
            <FiMapPin className="text-blue-600 text-xl" />
          )}
          <h3 className={`font-semibold ${emergencyMode ? 'text-red-800' : 'text-gray-800'}`}>
            {emergencyMode ? 'Emergency Location Tracking' : 'Location Tracker'}
          </h3>
        </div>
        
        {tracking && (
          <button
            onClick={stopTracking}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* Permission Status */}
      {permission === 'denied' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <FiAlertTriangle className="text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Location Access Denied</p>
              <p className="text-xs text-red-600">Please enable location access in your browser settings</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Location Status */}
      {location && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FiCheckCircle className="text-green-600" />
              <span className="text-sm font-medium text-green-800">Location Found</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full bg-${accuracyStatus.color}-100 text-${accuracyStatus.color}-800`}>
              {accuracyStatus.text} Accuracy
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
            <div>
              <span className="font-medium">Latitude:</span> {location.lat.toFixed(6)}
            </div>
            <div>
              <span className="font-medium">Longitude:</span> {location.lng.toFixed(6)}
            </div>
            <div>
              <span className="font-medium">Accuracy:</span> ±{Math.round(accuracy)}m
            </div>
            <div>
              <span className="font-medium">Updated:</span> {location.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        {!tracking ? (
          <button
            onClick={requestPermission}
            disabled={permission === 'denied'}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors w-full sm:w-auto min-h-[48px] ${
              emergencyMode
                ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300'
            }`}
          >
            <FiMapPin className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{emergencyMode ? 'Start Emergency Tracking' : 'Start Tracking'}</span>
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors w-full sm:w-auto min-h-[48px]"
          >
            <FiX className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">Stop Tracking</span>
          </button>
        )}

        {tracking && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Tracking active</span>
          </div>
        )}
      </div>

      {/* Emergency Mode Info */}
      {emergencyMode && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <FiShield className="text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Emergency Mode Active</p>
              <p className="text-xs text-yellow-600">
                Your location is being continuously tracked and shared with emergency responders
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationTracker;
