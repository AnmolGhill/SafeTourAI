import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiMapPin, FiAlertTriangle, FiCheckCircle, FiX, FiMap, FiMove } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GeoFencing = ({ onLocationUpdate }) => {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [permission, setPermission] = useState('prompt');
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [map, setMap] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [currentZoneStatus, setCurrentZoneStatus] = useState(null);
  const [cursorMode, setCursorMode] = useState(false);
  const [cursorLocation, setCursorLocation] = useState(null);
  const [restrictedPolygon, setRestrictedPolygon] = useState(null);
  const [draggableMarker, setDraggableMarker] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef(null);
  const zonesRef = useRef([]);
  const lastToastRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Meghalaya Zones - Shillong and Nearby Areas
  // Multiple restricted and unrestricted zones for comprehensive coverage
  
  const ZONES = {
    restricted: [
      {
        id: 'shillong_govt',
        name: 'Shillong - Government Complex',
        polygon: [
          { lat: 25.5850, lng: 91.8850 },
          { lat: 25.5900, lng: 91.8950 },
          { lat: 25.5880, lng: 91.9050 },
          { lat: 25.5750, lng: 91.9100 },
          { lat: 25.5650, lng: 91.9000 },
          { lat: 25.5600, lng: 91.8850 },
          { lat: 25.5700, lng: 91.8750 },
          { lat: 25.5800, lng: 91.8800 }
        ],
        description: 'High-security government area',
        color: '#dc2626'
      },
      {
        id: 'nongkrem_restricted',
        name: 'Nongkrem - Restricted Area',
        polygon: [
          { lat: 25.6200, lng: 91.8500 },
          { lat: 25.6250, lng: 91.8600 },
          { lat: 25.6200, lng: 91.8700 },
          { lat: 25.6100, lng: 91.8650 }
        ],
        description: 'Sacred site - restricted access',
        color: '#ea580c'
      },
      {
        id: 'umiam_restricted',
        name: 'Umiam - Dam Area (Restricted)',
        polygon: [
          { lat: 25.5400, lng: 91.7800 },
          { lat: 25.5500, lng: 91.7900 },
          { lat: 25.5450, lng: 91.8000 },
          { lat: 25.5350, lng: 91.7950 }
        ],
        description: 'Dam security zone - no entry',
        color: '#f59e0b'
      }
    ],
    safe: [
      {
        id: 'shillong_city',
        name: 'Shillong City Center',
        polygon: [
          { lat: 25.5750, lng: 91.8800 },
          { lat: 25.5850, lng: 91.8900 },
          { lat: 25.5800, lng: 91.9000 },
          { lat: 25.5700, lng: 91.8950 }
        ],
        description: 'Safe - Well patrolled city center',
        color: '#10b981'
      },
      {
        id: 'laitumkhrah',
        name: 'Laitumkhrah - Safe Zone',
        polygon: [
          { lat: 25.5500, lng: 91.9000 },
          { lat: 25.5600, lng: 91.9100 },
          { lat: 25.5550, lng: 91.9200 },
          { lat: 25.5450, lng: 91.9150 }
        ],
        description: 'Safe residential area',
        color: '#10b981'
      },
      {
        id: 'nongkrem_safe',
        name: 'Nongkrem - Safe Area',
        polygon: [
          { lat: 25.6100, lng: 91.8400 },
          { lat: 25.6150, lng: 91.8500 },
          { lat: 25.6100, lng: 91.8600 },
          { lat: 25.6050, lng: 91.8550 }
        ],
        description: 'Safe - Tourist area',
        color: '#10b981'
      },
      {
        id: 'umiam_safe',
        name: 'Umiam - Safe Zone',
        polygon: [
          { lat: 25.5300, lng: 91.7700 },
          { lat: 25.5400, lng: 91.7800 },
          { lat: 25.5350, lng: 91.7900 },
          { lat: 25.5250, lng: 91.7850 }
        ],
        description: 'Safe - Recreational area',
        color: '#10b981'
      },
      {
        id: 'mawlynnong',
        name: 'Mawlynnong - Safe Zone',
        polygon: [
          { lat: 25.2900, lng: 91.8200 },
          { lat: 25.3000, lng: 91.8300 },
          { lat: 25.2950, lng: 91.8400 },
          { lat: 25.2850, lng: 91.8350 }
        ],
        description: 'Safe - Tourist destination',
        color: '#10b981'
      }
    ]
  };

  const SHILLONG_CENTER = { lat: 25.5788, lng: 91.8933 };
  const SHILLONG_ZOOM = 12;

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

  // Geolocation options
  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0
  };

  // Point-in-polygon algorithm (Ray casting)
  const isPointInPolygon = (point, polygon) => {
    const { lat, lng } = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Check if location is in any zone
  const checkZoneStatus = (lat, lng) => {
    let status = { type: 'unrestricted', zone: null, description: 'Outside all zones' };

    // Check restricted zones first
    for (let zone of ZONES.restricted) {
      if (isPointInPolygon({ lat, lng }, zone.polygon)) {
        status = {
          type: 'restricted',
          zone: zone.name,
          description: zone.description,
          zoneId: zone.id
        };
        break;
      }
    }

    // Check safe zones if not in restricted
    if (status.type === 'unrestricted') {
      for (let zone of ZONES.safe) {
        if (isPointInPolygon({ lat, lng }, zone.polygon)) {
          status = {
            type: 'safe',
            zone: zone.name,
            description: zone.description,
            zoneId: zone.id
          };
          break;
        }
      }
    }

    // Show toast notification (debounced to avoid spam)
    const now = Date.now();
    if (!lastToastRef.current || now - lastToastRef.current > 2000) {
      if (status.type === 'restricted') {
        toast.error(`⚠️ ${status.zone} - RESTRICTED!`, {
          duration: 4000,
          position: 'top-center'
        });
      } else if (status.type === 'safe') {
        toast.success(`✅ ${status.zone} - SAFE`, {
          duration: 2000,
          position: 'top-center'
        });
      } else {
        toast.info(`ℹ️ Outside all defined zones`, {
          duration: 2000,
          position: 'top-center'
        });
      }
      lastToastRef.current = now;
    }

    setCurrentZoneStatus(status);
    return status;
  };

  // Handle location success
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

    // Check zone status
    checkZoneStatus(latitude, longitude);

    // Update map if visible
    if (map && showMap) {
      map.setCenter({ lat: latitude, lng: longitude });
      updateUserMarker(latitude, longitude);
    }

    // Call parent callback
    if (onLocationUpdate) {
      onLocationUpdate(locationData);
    }
  }, [map, showMap, onLocationUpdate]);

  // Handle location error
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
    toast.error(errorMessage);
  }, []);

  // Update user marker on map
  const updateUserMarker = (lat, lng) => {
    if (userMarker) {
      userMarker.setPosition({ lat, lng });
    }
  };

  // Create draggable marker
  const createDraggableMarker = (mapInstance, initialLat, initialLng) => {
    if (!window.google || !window.google.maps) return null;

    const marker = new window.google.maps.Marker({
      position: { lat: initialLat, lng: initialLng },
      map: mapInstance,
      draggable: true,
      title: 'Drag me to simulate movement',
      icon: {
        url: `data:image/svg+xml;base64,${btoa(`
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16C0 24 16 40 16 40S32 24 32 16C32 7.163 24.837 0 16 0Z" fill="#ef4444"/>
            <circle cx="16" cy="16" r="8" fill="#ffffff"/>
            <circle cx="16" cy="16" r="4" fill="#ef4444"/>
            <path d="M16 8V24M8 16H24" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(32, 40),
        anchor: new window.google.maps.Point(16, 40)
      }
    });

    // Handle drag start
    marker.addListener('dragstart', () => {
      setIsDragging(true);
    });

    // Handle drag end
    marker.addListener('dragend', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setCursorLocation({ lat, lng });
      checkZoneStatus(lat, lng);
      setIsDragging(false);
    });

    // Handle drag (continuous)
    marker.addListener('drag', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setCursorLocation({ lat, lng });
      checkZoneStatus(lat, lng);
    });

    return marker;
  };

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!window.google || !window.google.maps || !mapRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: SHILLONG_CENTER,
      zoom: SHILLONG_ZOOM,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(mapInstance);
    mapInstanceRef.current = mapInstance;

    // Clear previous zones
    zonesRef.current.forEach(polygon => polygon.setMap(null));
    zonesRef.current = [];

    // Draw all restricted zones
    ZONES.restricted.forEach(zone => {
      const polygon = new window.google.maps.Polygon({
        paths: zone.polygon,
        map: mapInstance,
        fillColor: zone.color,
        fillOpacity: 0.25,
        strokeColor: zone.color,
        strokeWeight: 2,
        strokeOpacity: 0.9,
        title: zone.name
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #7f1d1d; font-weight: bold;">🚫 ${zone.name}</h4>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #1f2937;">
              ${zone.description}
            </p>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              <strong>Status:</strong> RESTRICTED - Do not enter
            </p>
          </div>
        `
      });

      polygon.addListener('click', (e) => {
        infoWindow.setPosition(e.latLng);
        infoWindow.open(mapInstance);
      });

      zonesRef.current.push(polygon);
    });

    // Draw all safe zones
    ZONES.safe.forEach(zone => {
      const polygon = new window.google.maps.Polygon({
        paths: zone.polygon,
        map: mapInstance,
        fillColor: zone.color,
        fillOpacity: 0.25,
        strokeColor: zone.color,
        strokeWeight: 2.5,
        strokeOpacity: 0.9,
        title: zone.name
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #047857; font-weight: bold;">✅ ${zone.name}</h4>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #1f2937;">
              ${zone.description}
            </p>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              <strong>Status:</strong> SAFE - You can travel
            </p>
          </div>
        `
      });

      polygon.addListener('click', (e) => {
        infoWindow.setPosition(e.latLng);
        infoWindow.open(mapInstance);
      });

      zonesRef.current.push(polygon);
    });

    // Create draggable marker for simulation
    const marker = createDraggableMarker(mapInstance, SHILLONG_CENTER.lat, SHILLONG_CENTER.lng);
    if (marker) {
      setDraggableMarker(marker);
    }

    // Click on map to place marker
    mapInstance.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (marker) {
        marker.setPosition({ lat, lng });
        setCursorLocation({ lat, lng });
        checkZoneStatus(lat, lng);
      }
    });

    // Add user location marker (if tracking real location)
    if (location && !cursorMode) {
      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapInstance,
        title: 'Your Location',
        icon: {
          url: `data:image/svg+xml;base64,${btoa(`
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16C0 24 16 40 16 40S32 24 32 16C32 7.163 24.837 0 16 0Z" fill="#3b82f6"/>
              <circle cx="16" cy="16" r="8" fill="#ffffff"/>
              <circle cx="16" cy="16" r="4" fill="#3b82f6"/>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(32, 40),
          anchor: new window.google.maps.Point(16, 40)
        }
      });
      setUserMarker(marker);
    }

    // Add cursor tracking if enabled
    if (cursorMode) {
      mapInstance.addListener('mousemove', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setCursorLocation({ lat, lng });
        checkZoneStatus(lat, lng);

        // Update or create cursor marker
        if (userMarker) {
          userMarker.setPosition({ lat, lng });
        } else {
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            title: 'Cursor Position',
            icon: {
              url: `data:image/svg+xml;base64,${btoa(`
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.163 0 0 7.163 0 16C0 24 16 40 16 40S32 24 32 16C32 7.163 24.837 0 16 0Z" fill="#8b5cf6"/>
                  <circle cx="16" cy="16" r="8" fill="#ffffff"/>
                  <circle cx="16" cy="16" r="4" fill="#8b5cf6"/>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(32, 40),
              anchor: new window.google.maps.Point(16, 40)
            }
          });
          setUserMarker(marker);
        }
      });

      // Remove cursor tracking on mouse leave
      mapRef.current.addEventListener('mouseleave', () => {
        if (userMarker) {
          userMarker.setMap(null);
          setUserMarker(null);
        }
      });
    }
  }, [location, cursorMode]);

  // Start geo-fencing
  const startGeoFencing = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    if (permission === 'denied') {
      setError('Location access denied. Please enable location access in your browser settings.');
      return;
    }

    setTracking(true);
    setShowMap(true);
    setError(null);

    toast.loading('Starting Geo-Fencing...', { id: 'geofencing' });

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSuccess(position);
        toast.dismiss('geofencing');
        toast.success('Geo-Fencing activated! Monitoring restricted zones...', {
          duration: 3000,
          position: 'top-center'
        });

        // Start continuous tracking
        const id = navigator.geolocation.watchPosition(
          handleLocationSuccess,
          (watchError) => {
            console.warn('Watch position error:', watchError);
          },
          geoOptions
        );
        setWatchId(id);
      },
      (error) => {
        handleLocationError(error);
        toast.dismiss('geofencing');
      },
      geoOptions
    );
  }, [permission, handleLocationSuccess, handleLocationError]);

  // Stop geo-fencing
  const stopGeoFencing = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTracking(false);
    setShowMap(false);
    toast.success('Geo-Fencing deactivated');
  };

  // Initialize map when showMap changes
  useEffect(() => {
    if (showMap && !map) {
      const timer = setTimeout(() => {
        initializeMap();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showMap, map, initializeMap]);

  // Get accuracy status
  const getAccuracyStatus = () => {
    if (!accuracy) return { color: 'gray', text: 'Unknown' };
    if (accuracy <= 10) return { color: 'green', text: 'High' };
    if (accuracy <= 50) return { color: 'yellow', text: 'Medium' };
    return { color: 'red', text: 'Low' };
  };

  const accuracyStatus = getAccuracyStatus();

  return (
    <div className="p-4 rounded-lg border bg-white border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiMap className="text-purple-600 text-xl" />
          <h3 className="font-semibold text-gray-800">Geo-Fencing (Meghalaya)</h3>
        </div>
        
        {tracking && (
          <button
            onClick={stopGeoFencing}
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

      {/* Current Zone Status */}
      {currentZoneStatus && (
        <div className={`mb-4 p-3 rounded-lg border ${
          currentZoneStatus.type === 'safe' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {currentZoneStatus.type === 'safe' ? (
                <FiCheckCircle className="text-green-600" />
              ) : (
                <FiAlertTriangle className="text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                currentZoneStatus.type === 'safe' ? 'text-green-800' : 'text-red-800'
              }`}>
                {currentZoneStatus.type === 'safe' ? 'Safe Area' : 'Restricted Zone'}
              </span>
            </div>
          </div>
          <div className={`text-xs ${
            currentZoneStatus.type === 'safe' ? 'text-green-700' : 'text-red-700'
          }`}>
            <p className="font-medium">{currentZoneStatus.zone}</p>
            <p>{currentZoneStatus.description}</p>
            {cursorLocation && (
              <p>Position: {cursorLocation.lat.toFixed(6)}°, {cursorLocation.lng.toFixed(6)}°</p>
            )}
          </div>
        </div>
      )}

      {/* Location Status */}
      {location && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FiCheckCircle className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Location Found</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full bg-${accuracyStatus.color}-100 text-${accuracyStatus.color}-800`}>
              {accuracyStatus.text} Accuracy
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
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

      {/* Map Display */}
      {showMap && (
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
          <div 
            ref={mapRef}
            style={{ height: '400px', width: '100%' }}
            className="bg-gray-100"
          >
            {!window.google && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FiMap className="mx-auto text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-500">Loading Google Maps...</p>
                </div>
              </div>
            )}
          </div>

          {/* Map Legend */}
          <div className="bg-gray-50 p-3 border-t border-gray-200">
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Restricted Zones:</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                {ZONES.restricted.map(zone => (
                  <div key={zone.id} className="flex items-center space-x-2">
                    <div className="w-4 h-4" style={{ backgroundColor: zone.color, opacity: 0.6, border: `2px solid ${zone.color}` }}></div>
                    <span className="text-gray-700 truncate">{zone.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Safe Zones:</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                {ZONES.safe.map(zone => (
                  <div key={zone.id} className="flex items-center space-x-2">
                    <div className="w-4 h-4" style={{ backgroundColor: zone.color, opacity: 0.5, border: `2px solid ${zone.color}` }}></div>
                    <span className="text-gray-700 truncate">{zone.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-4 bg-blue-600 rounded-sm"></div>
                <span className="text-gray-700">Your Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-4 bg-purple-600 rounded-sm"></div>
                <span className="text-gray-700">Cursor Position</span>
              </div>
            </div>

            {/* Cursor Mode Toggle */}
            <div className="border-t border-gray-300 pt-3">
              <button
                onClick={() => setCursorMode(!cursorMode)}
                className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  cursorMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                <FiMove className="w-4 h-4" />
                <span>{cursorMode ? 'Cursor Mode: ON' : 'Cursor Mode: OFF'}</span>
              </button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                {cursorMode 
                  ? 'Move your cursor on the map to simulate location'
                  : 'Enable cursor mode to test geofencing'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        {!tracking ? (
          <button
            onClick={startGeoFencing}
            disabled={permission === 'denied'}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors flex-1 min-h-[48px] ${
              permission === 'denied'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <FiMap className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">Start Geo-Fencing</span>
          </button>
        ) : (
          <button
            onClick={stopGeoFencing}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors flex-1 min-h-[48px]"
          >
            <FiX className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">Stop Geo-Fencing</span>
          </button>
        )}

        {tracking && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>Active</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-xs text-purple-700 mb-2">
          <strong>🗺️ Meghalaya Geo-Fencing:</strong> Interactive geofencing for Shillong & nearby areas.
        </p>
        <div className="text-xs text-purple-700 mb-2">
          <p className="font-semibold mb-1">Zones Covered:</p>
          <p className="ml-2">🚫 Restricted: {ZONES.restricted.length} zones | ✅ Safe: {ZONES.safe.length} zones</p>
        </div>
        <ul className="text-xs text-purple-700 list-disc list-inside space-y-1">
          <li><strong>Drag Marker:</strong> Click and drag to simulate movement</li>
          <li><strong>Click to Place:</strong> Click on map to place marker</li>
          <li><strong>Cursor Mode:</strong> Move cursor to simulate location</li>
          <li><strong>Real Location:</strong> Use actual GPS location</li>
          <li><strong>Alerts:</strong> Get notifications for zone changes</li>
          <li><strong>Multiple Zones:</strong> Check all restricted & safe areas</li>
        </ul>
      </div>
    </div>
  );
};

export default GeoFencing;
