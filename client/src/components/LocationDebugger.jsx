import React, { useState, useEffect } from 'react';
import { FiMapPin, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const LocationDebugger = () => {
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state);
        });
      } catch (err) {
        console.error('Permission check failed:', err);
      }
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    console.log('🗺️ Starting location request...');
    console.log('📍 Permission status:', permissionStatus);

    // Try high accuracy first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ High-accuracy location success:', position);
        
        const locationInfo = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toLocaleString(),
          method: 'High Accuracy GPS'
        };
        
        setLocationData(locationInfo);
        setLoading(false);
      },
      (error) => {
        console.error('❌ High-accuracy failed, trying fallback:', error);
        
        // Fallback to network-based location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('⚠️ Fallback location success:', position);
            
            const locationInfo = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: new Date(position.timestamp).toLocaleString(),
              method: 'Network-based Location'
            };
            
            setLocationData(locationInfo);
            setLoading(false);
          },
          (fallbackError) => {
            console.error('❌ All location methods failed:', fallbackError);
            
            let errorMessage = 'Failed to get location';
            switch (fallbackError.code) {
              case fallbackError.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
                break;
              case fallbackError.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Check your GPS/network connection.';
                break;
              case fallbackError.TIMEOUT:
                errorMessage = 'Location request timed out. Try again or check your connection.';
                break;
            }
            
            setError(errorMessage);
            setLoading(false);
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000
      }
    );
  };

  const getPermissionColor = () => {
    switch (permissionStatus) {
      case 'granted': return 'text-green-600 bg-green-100';
      case 'denied': return 'text-red-600 bg-red-100';
      case 'prompt': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (!accuracy) return 'text-gray-600';
    if (accuracy <= 10) return 'text-green-600';
    if (accuracy <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FiMapPin className="text-blue-600 text-xl" />
          <h3 className="text-lg font-semibold text-gray-800">Location Debugger</h3>
        </div>
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <FiRefreshCw className="animate-spin" />
          ) : (
            'Get Location'
          )}
        </button>
      </div>

      {/* Permission Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Permission Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getPermissionColor()}`}>
            {permissionStatus.toUpperCase()}
          </span>
        </div>
        
        {permissionStatus === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <FiAlertCircle className="text-red-500 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">Location Access Denied</p>
                <p className="text-red-600 text-xs mt-1">
                  Please enable location permissions in your browser settings and refresh the page.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <FiAlertCircle className="text-red-500 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm font-medium">Location Error</p>
              <p className="text-red-600 text-xs mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Location Data */}
      {locationData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <FiCheckCircle className="text-green-500" />
            <h4 className="text-green-800 font-medium">Location Retrieved</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Latitude:</span>
              <span className="ml-2 font-mono text-gray-800">{locationData.latitude?.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-600">Longitude:</span>
              <span className="ml-2 font-mono text-gray-800">{locationData.longitude?.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-600">Accuracy:</span>
              <span className={`ml-2 font-mono ${getAccuracyColor(locationData.accuracy)}`}>
                {locationData.accuracy ? `${Math.round(locationData.accuracy)}m` : 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Method:</span>
              <span className="ml-2 text-gray-800">{locationData.method}</span>
            </div>
            <div>
              <span className="text-gray-600">Timestamp:</span>
              <span className="ml-2 text-gray-800">{locationData.timestamp}</span>
            </div>
            {locationData.altitude && (
              <div>
                <span className="text-gray-600">Altitude:</span>
                <span className="ml-2 font-mono text-gray-800">{Math.round(locationData.altitude)}m</span>
              </div>
            )}
          </div>

          {/* Google Maps Link */}
          <div className="mt-3 pt-3 border-t border-green-200">
            <a
              href={`https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              View on Google Maps →
            </a>
          </div>

          {/* Distance Calculator */}
          <div className="mt-3 pt-3 border-t border-green-200">
            <h5 className="text-xs font-medium text-green-800 mb-2">Distance Calculator</h5>
            <div className="text-xs text-green-700">
              <div>Your Location: {locationData.latitude?.toFixed(4)}, {locationData.longitude?.toFixed(4)}</div>
              <div className="mt-1">
                <button
                  onClick={() => {
                    // Store user location in localStorage for distance calculations
                    localStorage.setItem('userLocation', JSON.stringify({
                      lat: locationData.latitude,
                      lng: locationData.longitude,
                      timestamp: Date.now()
                    }));
                    alert('Location saved! Distances will now be calculated from this position.');
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Set as Reference Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Browser Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Browser Information</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>User Agent: {navigator.userAgent}</div>
          <div>Geolocation Support: {navigator.geolocation ? '✅ Yes' : '❌ No'}</div>
          <div>HTTPS: {window.location.protocol === 'https:' ? '✅ Yes' : '❌ No (Required for accurate location)'}</div>
          <div>Connection: {navigator.onLine ? '✅ Online' : '❌ Offline'}</div>
        </div>
        
        {/* Permission Tips */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-xs font-medium text-blue-800 mb-1">Location Permission Tips:</h5>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Click the location icon in your browser's address bar</li>
            <li>• Select "Always allow" for persistent permissions</li>
            <li>• If permission is blocked, refresh the page and try again</li>
            <li>• For laptops: Network location may be less accurate than GPS</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationDebugger;
