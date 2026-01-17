import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMapPin, 
  FiAlertTriangle, 
  FiShield,
  FiRefreshCw,
  FiEye,
  FiNavigation,
  FiLayers,
  FiFilter,
  FiInfo,
  FiPhone,
  FiHome,
  FiTruck,
  FiClock,
  FiUsers,
  FiTarget
} from 'react-icons/fi';
import { mapsService } from '../../services/mapsService';
import googleMapsLoader from '../../utils/googleMapsLoader';

const EnhancedSafetyMap = () => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [dangerZones, setDangerZones] = useState([]);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [mapStyle, setMapStyle] = useState('roadmap');
  const [filterLevel, setFilterLevel] = useState('all'); // all, high, medium, low
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const zonesRef = useRef([]);
  const mapInstanceId = useRef(`enhanced-safety-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Mock danger zones data with real coordinates
  const mockDangerZones = [
    {
      id: 1,
      name: "Downtown Market Area",
      location: { lat: 40.7128, lng: -74.0060 },
      riskLevel: "high",
      riskScore: 85,
      incidents: 12,
      lastIncident: "2 hours ago",
      type: "theft",
      description: "High pickpocket activity reported",
      radius: 300,
      color: "#ef4444",
      recentIncidents: [
        { type: "pickpocket", time: "2 hours ago", severity: "medium" },
        { type: "bag snatch", time: "5 hours ago", severity: "high" },
        { type: "tourist scam", time: "1 day ago", severity: "low" }
      ]
    },
    {
      id: 2,
      name: "Tourist District",
      location: { lat: 40.7589, lng: -73.9851 },
      riskLevel: "medium",
      riskScore: 65,
      incidents: 7,
      lastIncident: "1 day ago",
      type: "scam",
      description: "Tourist scam activities",
      radius: 250,
      color: "#f97316",
      recentIncidents: [
        { type: "fake tickets", time: "1 day ago", severity: "medium" },
        { type: "overcharging", time: "2 days ago", severity: "low" }
      ]
    },
    {
      id: 3,
      name: "Central Park North",
      location: { lat: 40.7829, lng: -73.9654 },
      riskLevel: "low",
      riskScore: 25,
      incidents: 2,
      lastIncident: "1 week ago",
      type: "minor",
      description: "Occasional minor incidents",
      radius: 200,
      color: "#22c55e",
      recentIncidents: [
        { type: "minor theft", time: "1 week ago", severity: "low" }
      ]
    },
    {
      id: 4,
      name: "Nightlife District",
      location: { lat: 40.7505, lng: -73.9934 },
      riskLevel: "high",
      riskScore: 78,
      incidents: 9,
      lastIncident: "4 hours ago",
      type: "assault",
      description: "Late night safety concerns",
      radius: 350,
      color: "#ef4444",
      recentIncidents: [
        { type: "harassment", time: "4 hours ago", severity: "high" },
        { type: "drunk incident", time: "1 day ago", severity: "medium" }
      ]
    },
    {
      id: 5,
      name: "Shopping Center",
      location: { lat: 40.7614, lng: -73.9776 },
      riskLevel: "medium",
      riskScore: 45,
      incidents: 4,
      lastIncident: "3 days ago",
      type: "theft",
      description: "Bag snatching incidents",
      radius: 180,
      color: "#f97316",
      recentIncidents: [
        { type: "bag snatch", time: "3 days ago", severity: "medium" }
      ]
    }
  ];

  // Initialize Google Map
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    const initMap = async () => {
      console.log(`[${mapInstanceId.current}] Initializing Enhanced Safety Map...`);
      
      if (!isMounted) return; // Exit if component unmounted
      
      if (!mapRef.current) {
        console.warn(`[${mapInstanceId.current}] Map container not ready`);
        setLoading(false);
        return;
      }

      try {
        // Add small delay to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted) return; // Exit if component unmounted during delay
        
        // Use centralized Google Maps loader
        console.log(`[${mapInstanceId.current}] Loading Google Maps API...`);
        await googleMapsLoader.loadGoogleMaps();
        
        if (!isMounted) return; // Exit if component unmounted during API load
        
        if (!window.google || !window.google.maps) {
          console.error(`[${mapInstanceId.current}] Google Maps API not available`);
          if (isMounted) {
            setHasError(true);
            setErrorMessage('Google Maps API failed to load. Please check your internet connection and API key.');
            setLoading(false);
          }
          return;
        }

        console.log(`[${mapInstanceId.current}] Creating map instance...`);
        const mapOptions = {
          zoom: 12,
          center: new window.google.maps.LatLng(40.7128, -74.0060), // NYC default
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true
        };

        if (!isMounted || !mapRef.current) return; // Final check before map creation

        const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
        
        if (isMounted) {
          setMap(newMap);
          console.log(`[${mapInstanceId.current}] Map created successfully`);
          
          // Get user location
          getCurrentLocation(newMap);
        }
      } catch (error) {
        console.error(`[${mapInstanceId.current}] Error initializing Enhanced Safety Map:`, error);
        if (isMounted) {
          setHasError(true);
          setErrorMessage(`Failed to initialize map: ${error.message}`);
          setLoading(false);
        }
      }
    };

    // Add delay before initialization to prevent conflicts
    const timeoutId = setTimeout(initMap, 300); // Increased delay

    return () => {
      isMounted = false; // Mark component as unmounted
      clearTimeout(timeoutId);
      // Cleanup markers and zones
      clearMapElements();
    };
  }, []);

  // Load danger zones and services when map is ready
  useEffect(() => {
    if (map) {
      loadDangerZones();
      if (userLocation) {
        loadNearbyServices();
      }
    }
  }, [map, userLocation]);

  // Update map style
  useEffect(() => {
    if (map && window.google) {
      try {
        const mapTypeId = window.google.maps.MapTypeId[mapStyle.toUpperCase()] || window.google.maps.MapTypeId.ROADMAP;
        map.setMapTypeId(mapTypeId);
      } catch (error) {
        console.error('Error setting map style:', error);
      }
    }
  }, [map, mapStyle]);

  const getCurrentLocation = async (mapInstance) => {
    try {
      const location = await mapsService.getCurrentLocation();
      setUserLocation(location);
      
      if (mapInstance) {
        mapInstance.setCenter(location);
        mapInstance.setZoom(14);
        addUserLocationMarker(mapInstance, location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Use default NYC location
      const defaultLocation = { lat: 40.7128, lng: -74.0060 };
      setUserLocation(defaultLocation);
    } finally {
      setLoading(false);
    }
  };

  const addUserLocationMarker = (mapInstance, location) => {
    if (!mapInstance || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.warn('Invalid location data for user marker:', location);
      return;
    }

    try {
      const marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(location.lat, location.lng),
        map: mapInstance,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      markersRef.current.push(marker);
    } catch (error) {
      console.error('Error adding user location marker:', error);
    }
  };

  const loadDangerZones = () => {
    setDangerZones(mockDangerZones);
    if (map && showDangerZones) {
      renderDangerZones();
    }
  };

  const loadNearbyServices = async () => {
    if (!userLocation) return;

    try {
      const result = await mapsService.getNearbyServices(
        userLocation.lat, 
        userLocation.lng,
        { radius: 5000, types: ['police', 'hospital', 'fire_station', 'lodging'] }
      );

      if (result.success && result.data && result.data.services) {
        // Filter out services with invalid coordinates
        const validServices = result.data.services.filter(service => {
          const isValid = service && 
                          typeof service.lat === 'number' && 
                          typeof service.lng === 'number' && 
                          !isNaN(service.lat) && 
                          !isNaN(service.lng) &&
                          service.lat >= -90 && service.lat <= 90 &&
                          service.lng >= -180 && service.lng <= 180;
          
          if (!isValid) {
            console.warn('Filtered out invalid service:', service);
          }
          return isValid;
        });

        console.log(`Loaded ${validServices.length} valid services out of ${result.data.services.length} total`);
        setNearbyServices(validServices);
        
        if (map && showServices && validServices.length > 0) {
          renderNearbyServices(validServices);
        }
      } else {
        console.log('No services data received from API, using empty array');
        setNearbyServices([]);
      }
    } catch (error) {
      console.error('Error loading nearby services:', error);
      console.log('Using empty services array due to API error');
      setNearbyServices([]);
      
      // Don't render anything if there's an error - just log it
      if (map && showServices) {
        console.log('Skipping service rendering due to API error');
      }
    }
  };

  const renderDangerZones = () => {
    if (!map || !window.google) {
      console.warn('Map or Google Maps not available for rendering zones');
      return;
    }

    // Clear existing zones
    zonesRef.current.forEach(zone => {
      if (zone.circle) zone.circle.setMap(null);
      if (zone.marker) zone.marker.setMap(null);
    });
    zonesRef.current = [];

    const filteredZones = dangerZones.filter(zone => {
      if (filterLevel === 'all') return true;
      return zone.riskLevel === filterLevel;
    });

    filteredZones.forEach(zone => {
      try {
        if (!zone.location || typeof zone.location.lat !== 'number' || typeof zone.location.lng !== 'number') {
          console.warn('Invalid zone location:', zone);
          return;
        }

        const zonePosition = new window.google.maps.LatLng(zone.location.lat, zone.location.lng);

        // Create danger zone circle
        const circle = new window.google.maps.Circle({
          strokeColor: zone.color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: zone.color,
          fillOpacity: 0.2,
          map: map,
          center: zonePosition,
          radius: zone.radius || 200
        });

        // Create zone marker
        const marker = new window.google.maps.Marker({
          position: zonePosition,
          map: map,
          title: zone.name,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: zone.color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1
          }
        });

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: createZoneInfoContent(zone)
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedZone(zone);
        });

        circle.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedZone(zone);
        });

        zonesRef.current.push({ circle, marker, infoWindow });
      } catch (error) {
        console.error('Error rendering danger zone:', zone.name, error);
      }
    });
  };

  const renderNearbyServices = (services) => {
    if (!map || !window.google || !Array.isArray(services)) {
      console.warn('Map, Google Maps, or services not available for rendering');
      return;
    }

    try {
      // Clear existing service markers safely
      const markersToRemove = [];
      markersRef.current.forEach((marker, index) => {
        if (marker.serviceType) {
          try {
            marker.setMap(null);
            markersToRemove.push(index);
          } catch (error) {
            console.warn('Error removing service marker:', error);
          }
        }
      });
      
      // Remove cleared markers from array
      markersRef.current = markersRef.current.filter(marker => !marker.serviceType);

      // Add new service markers
      services.forEach(service => {
        try {
          // Validate service data
          if (!service || 
              typeof service.lat !== 'number' || 
              typeof service.lng !== 'number' ||
              isNaN(service.lat) || 
              isNaN(service.lng) ||
              service.lat < -90 || service.lat > 90 ||
              service.lng < -180 || service.lng > 180) {
            console.warn('Skipping invalid service:', service);
            return;
          }

          const servicePosition = new window.google.maps.LatLng(service.lat, service.lng);

          const marker = new window.google.maps.Marker({
            position: servicePosition,
            map: map,
            title: service.name || 'Service',
            icon: getServiceIcon(service.type)
          });

          marker.serviceType = service.type;

          const infoWindow = new window.google.maps.InfoWindow({
            content: createServiceInfoContent(service)
          });

          marker.addListener('click', () => {
            try {
              infoWindow.open(map, marker);
            } catch (error) {
              console.error('Error opening info window:', error);
            }
          });

          markersRef.current.push(marker);
        } catch (error) {
          console.error('Error rendering service marker:', service?.name || 'Unknown', error);
        }
      });

      console.log(`Successfully rendered ${services.length} service markers`);
    } catch (error) {
      console.error('Error in renderNearbyServices:', error);
    }
  };

  const getServiceIcon = (type) => {
    const icons = {
      police: { color: '#ef4444', symbol: '🚔' },
      hospital: { color: '#22c55e', symbol: '🏥' },
      fire_station: { color: '#f97316', symbol: '🚒' },
      lodging: { color: '#3b82f6', symbol: '🏨' }
    };

    const icon = icons[type] || { color: '#6b7280', symbol: '📍' };
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.7 0 0 6.7 0 15c0 15 15 25 15 25s15-10 15-25C30 6.7 23.3 0 15 0z" fill="${icon.color}"/>
          <circle cx="15" cy="15" r="8" fill="white"/>
          <text x="15" y="20" text-anchor="middle" font-size="12">${icon.symbol}</text>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(30, 40),
      anchor: new window.google.maps.Point(15, 40)
    };
  };

  const createZoneInfoContent = (zone) => {
    return `
      <div style="max-width: 300px; padding: 10px;">
        <h3 style="margin: 0 0 8px 0; color: ${zone.color}; font-weight: bold;">
          ⚠️ ${zone.name}
        </h3>
        <div style="margin-bottom: 8px;">
          <span style="background: ${zone.color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${zone.riskLevel.toUpperCase()} RISK - ${zone.riskScore}%
          </span>
        </div>
        <p style="margin: 8px 0; font-size: 14px; color: #374151;">
          ${zone.description}
        </p>
        <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">
          <div>📊 ${zone.incidents} incidents reported</div>
          <div>🕒 Last incident: ${zone.lastIncident}</div>
          <div>📍 Type: ${zone.type}</div>
        </div>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <strong style="font-size: 12px; color: #374151;">Recent Incidents:</strong>
          ${zone.recentIncidents.map(incident => `
            <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
              • ${incident.type} (${incident.time}) - ${incident.severity}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const createServiceInfoContent = (service) => {
    return `
      <div style="max-width: 250px; padding: 8px;">
        <h4 style="margin: 0 0 6px 0; color: #374151; font-weight: bold;">
          ${service.name}
        </h4>
        <div style="font-size: 12px; color: #6b7280;">
          <div>📍 ${service.vicinity || 'Address not available'}</div>
          <div>⭐ Rating: ${service.rating || 'N/A'}</div>
          ${service.phone ? `<div>📞 ${service.phone}</div>` : ''}
          ${service.isOpen !== null ? `<div>🕒 ${service.isOpen ? 'Open' : 'Closed'}</div>` : ''}
        </div>
      </div>
    `;
  };

  const clearMapElements = () => {
    console.log(`[${mapInstanceId.current}] Clearing map elements...`);
    
    // Use setTimeout to defer cleanup and avoid React DOM conflicts
    setTimeout(() => {
      try {
        // Clear markers with individual try-catch
        if (markersRef.current && markersRef.current.length > 0) {
          markersRef.current.forEach((marker, index) => {
            try {
              if (marker && marker.setMap && typeof marker.setMap === 'function') {
                marker.setMap(null);
              }
            } catch (error) {
              // Silently handle individual marker errors
              console.debug(`[${mapInstanceId.current}] Marker ${index} cleanup handled:`, error.message);
            }
          });
        }
        
        // Clear zones with individual try-catch
        if (zonesRef.current && zonesRef.current.length > 0) {
          zonesRef.current.forEach((zone, index) => {
            try {
              if (zone.circle && zone.circle.setMap && typeof zone.circle.setMap === 'function') {
                zone.circle.setMap(null);
              }
            } catch (error) {
              console.debug(`[${mapInstanceId.current}] Zone circle ${index} cleanup handled:`, error.message);
            }
            
            try {
              if (zone.marker && zone.marker.setMap && typeof zone.marker.setMap === 'function') {
                zone.marker.setMap(null);
              }
            } catch (error) {
              console.debug(`[${mapInstanceId.current}] Zone marker ${index} cleanup handled:`, error.message);
            }
          });
        }
        
        // Clear arrays after cleanup attempts
        markersRef.current = [];
        zonesRef.current = [];
        console.log(`[${mapInstanceId.current}] Map elements cleared`);
        
      } catch (error) {
        console.debug(`[${mapInstanceId.current}] Cleanup handled:`, error.message);
        // Force clear arrays as fallback
        markersRef.current = [];
        zonesRef.current = [];
      }
    }, 0); // Defer to next tick
  };

  const centerOnUser = () => {
    if (map && userLocation && window.google) {
      try {
        const userPos = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);
        map.setCenter(userPos);
        map.setZoom(15);
      } catch (error) {
        console.error('Error centering on user:', error);
      }
    }
  };

  const showAllZones = () => {
    if (map && dangerZones.length > 0 && window.google) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        dangerZones.forEach(zone => {
          if (zone.location && typeof zone.location.lat === 'number' && typeof zone.location.lng === 'number') {
            bounds.extend(new window.google.maps.LatLng(zone.location.lat, zone.location.lng));
          }
        });
        if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
          bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
        }
        map.fitBounds(bounds);
      } catch (error) {
        console.error('Error showing all zones:', error);
      }
    }
  };

  const toggleDangerZones = () => {
    setShowDangerZones(!showDangerZones);
    if (!showDangerZones) {
      renderDangerZones();
    } else {
      zonesRef.current.forEach(zone => {
        if (zone.circle) zone.circle.setMap(null);
        if (zone.marker) zone.marker.setMap(null);
      });
    }
  };

  const toggleServices = () => {
    setShowServices(!showServices);
    if (!showServices) {
      renderNearbyServices(nearbyServices);
    } else {
      markersRef.current.forEach(marker => {
        if (marker.serviceType) {
          marker.setMap(null);
        }
      });
      markersRef.current = markersRef.current.filter(marker => !marker.serviceType);
    }
  };

  const getRiskLevelStats = () => {
    const stats = {
      high: dangerZones.filter(z => z.riskLevel === 'high').length,
      medium: dangerZones.filter(z => z.riskLevel === 'medium').length,
      low: dangerZones.filter(z => z.riskLevel === 'low').length
    };
    return stats;
  };

  const stats = getRiskLevelStats();

  // Show error fallback instead of crashing
  if (hasError) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <FiAlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Enhanced Safety Map</h3>
              <p className="text-sm text-red-600">Map temporarily unavailable</p>
            </div>
          </div>
        </div>
        
        <div className="text-center py-12">
          <FiMapPin className="mx-auto text-6xl text-red-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Map Loading Failed</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            {errorMessage || 'Unable to load the safety map. This could be due to network issues or API limitations.'}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setHasError(false);
                setErrorMessage('');
                setLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 mr-2"
            >
              <FiRefreshCw className="w-4 h-4 inline mr-2" />
              Retry
            </button>
            <button
              onClick={() => {
                setHasError(false);
                setErrorMessage('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Hide Map
            </button>
          </div>
        </div>
        
        {/* Show danger zone list as fallback */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Danger Zones (List View)</h4>
          <div className="space-y-2">
            {mockDangerZones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: zone.color }}></div>
                  <div>
                    <span className="font-medium text-gray-800">{zone.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({zone.riskLevel} risk)</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">{zone.riskScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <FiMapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Enhanced Safety Map</h3>
            <p className="text-sm text-gray-600">Interactive danger zones & emergency services</p>
          </div>
        </div>
        <button
          onClick={loadDangerZones}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <button
          onClick={toggleDangerZones}
          className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            showDangerZones 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiAlertTriangle className="w-4 h-4" />
          <span>Zones</span>
        </button>

        <button
          onClick={toggleServices}
          className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            showServices 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiShield className="w-4 h-4" />
          <span>Services</span>
        </button>

        <button
          onClick={centerOnUser}
          className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
        >
          <FiNavigation className="w-4 h-4" />
          <span>My Location</span>
        </button>

        <button
          onClick={showAllZones}
          className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
        >
          <FiTarget className="w-4 h-4" />
          <span>Show All</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiFilter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="high">High Risk Only</option>
            <option value="medium">Medium Risk Only</option>
            <option value="low">Low Risk Only</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiLayers className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Map:</span>
          </div>
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="roadmap">Roadmap</option>
            <option value="satellite">Satellite</option>
            <option value="hybrid">Hybrid</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.high}</div>
          <div className="text-xs text-red-800">High Risk</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.medium}</div>
          <div className="text-xs text-orange-800">Medium Risk</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.low}</div>
          <div className="text-xs text-green-800">Low Risk</div>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div 
          ref={mapRef} 
          style={{ height: '500px', width: '100%' }}
          className="bg-gray-100 rounded-lg"
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <FiRefreshCw className="mx-auto text-4xl text-gray-400 mb-2 animate-spin" />
                <p className="text-gray-500">Loading Enhanced Safety Map...</p>
              </div>
            </div>
          )}
          {!loading && !map && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center p-8">
                <FiMapPin className="mx-auto text-4xl text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Map Unavailable</h3>
                <p className="text-gray-600 mb-4">
                  Unable to load Google Maps. This could be due to:
                </p>
                <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
                  <li>• Missing or invalid Google Maps API key</li>
                  <li>• Network connectivity issues</li>
                  <li>• API quota exceeded</li>
                </ul>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
            <FiInfo className="w-4 h-4 mr-2" />
            Legend
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Risk Zones</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Medium Risk Zones</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low Risk Zones</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Your Location</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Click zones for details
            </div>
          </div>
        </div>
      </div>

      {/* Selected Zone Info */}
      {selectedZone && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: selectedZone.color }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">{selectedZone.name}</h4>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">{selectedZone.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Risk Level:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                selectedZone.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                selectedZone.riskLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }`}>
                {selectedZone.riskLevel.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Risk Score:</span>
              <span className="ml-2 font-medium">{selectedZone.riskScore}%</span>
            </div>
            <div>
              <span className="text-gray-500">Incidents:</span>
              <span className="ml-2 font-medium">{selectedZone.incidents}</span>
            </div>
            <div>
              <span className="text-gray-500">Last Incident:</span>
              <span className="ml-2 font-medium">{selectedZone.lastIncident}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Real-time safety monitoring</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
            <span>{nearbyServices.length} services nearby</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSafetyMap;
