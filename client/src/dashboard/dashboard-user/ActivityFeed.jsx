import React, { useState, useEffect, useRef } from 'react';
import { 
  FiBell, 
  FiMapPin, 
  FiLink, 
  FiAlertTriangle,
  FiCheckCircle,
  FiUser,
  FiClock,
  FiRefreshCw,
  FiMap,
  FiNavigation,
  FiPhone,
  FiShield,
  FiHome,
  FiTruck,
  FiX
} from 'react-icons/fi';
import LocationTracker from '../../components/LocationTracker';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [showLocationTracker, setShowLocationTracker] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [showServices, setShowServices] = useState(true);

  // Get current user for personalized activities
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const user = getCurrentUser();
  const userName = user?.name || user?.fullName || "User";

  // Fetch real activities from API
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/location/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedActivities = data.activities.map(activity => ({
            ...activity,
            timestamp: new Date(activity.timestamp),
            icon: getActivityIcon(activity.type),
            color: getActivityColor(activity.type)
          }));
          setActivities(formattedActivities);
        } else {
          setActivities([]);
        }
      } else {
        setActivities([]);
        console.error('Failed to fetch activities:', response.status);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'welcome':
      case 'system':
        return FiCheckCircle;
      case 'alert':
      case 'emergency':
        return FiAlertTriangle;
      case 'location':
        return FiMapPin;
      case 'blockchain':
        return FiLink;
      default:
        return FiBell;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'welcome':
      case 'system':
        return 'green';
      case 'alert':
      case 'emergency':
        return 'red';
      case 'location':
        return 'blue';
      case 'blockchain':
        return 'purple';
      default:
        return 'blue';
    }
  };

  useEffect(() => {
    fetchActivities();
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Google Maps when API is ready
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && showMap) {
        initializeMap();
      } else if (showMap) {
        // Retry after a short delay if Google Maps isn't ready yet
        setTimeout(checkGoogleMaps, 100);
      }
    };

    checkGoogleMaps();
  }, [showMap]);

  const initializeMap = () => {
    if (window.google && window.google.maps) {
      // Don't use fake coordinates - wait for real user location
      const center = userLocation || { lat: 0, lng: 0 };
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: userLocation ? 15 : 2, // World view if no location
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
      setMap(mapInstance);
      
      // Request location permission explicitly when map loads
      if (navigator.geolocation && !userLocation) {
        // Show permission request dialog
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(location);
            mapInstance.setCenter(location);
            mapInstance.setZoom(15);
            addUserLocationMarker(mapInstance, location);
            fetchNearbyServices(location.lat, location.lng);
          },
          (error) => {
            console.error('Location permission error:', error);
            if (error.code === error.PERMISSION_DENIED) {
              alert('Location access denied. Please enable location permissions to see nearby services and your current location.');
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
      
      // Add user location marker if available
      if (userLocation) {
        addUserLocationMarker(mapInstance, userLocation);
        fetchNearbyServices(userLocation.lat, userLocation.lng);
      }
      
      // Add markers for activities with location data
      activities.forEach(activity => {
        if (activity.location && activity.location.lat && activity.location.lng) {
          addActivityMarker(mapInstance, activity);
        }
      });
      
      // Add nearby services markers
      nearbyServices.forEach(service => {
        addServiceMarker(mapInstance, service);
      });
    }
  };

  // Re-initialize map when services are updated
  useEffect(() => {
    if (map && nearbyServices.length > 0) {
      // Clear existing service markers and add new ones
      nearbyServices.forEach(service => {
        addServiceMarker(map, service);
      });
    }
  }, [nearbyServices, map]);

  const addActivityMarker = (mapInstance, activity) => {
    const marker = new window.google.maps.Marker({
      position: { lat: activity.location.lat, lng: activity.location.lng },
      map: mapInstance,
      title: activity.title,
      icon: {
        url: getMarkerIcon(activity.type),
        scaledSize: new window.google.maps.Size(30, 30)
      }
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; max-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">${activity.title}</h4>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">${activity.description}</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">${new Date(activity.timestamp).toLocaleString()}</p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstance, marker);
    });
  };

  // Add user location marker
  const addUserLocationMarker = (mapInstance, location) => {
    new window.google.maps.Marker({
      position: location,
      map: mapInstance,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTIiIGZpbGw9IiMxMGI5ODEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxjaXJjbGUgY3g9IjE1IiBjeT0iMTUiIHI9IjUiIGZpbGw9IiNmZmZmZmYiLz4KPC9zdmc+',
        scaledSize: new window.google.maps.Size(30, 30)
      }
    });
  };
  
  // Add service marker
  const addServiceMarker = (mapInstance, service) => {
    const marker = new window.google.maps.Marker({
      position: { lat: service.lat, lng: service.lng },
      map: mapInstance,
      title: service.name,
      icon: {
        url: getServiceMarkerIcon(service.type),
        scaledSize: new window.google.maps.Size(25, 25)
      }
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; max-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">${service.name}</h4>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">${service.type}</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Distance: ${service.distance}km</p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstance, marker);
    });
  };
  
  const getServiceMarkerIcon = (type) => {
    const colors = {
      'police': '#ef4444',
      'hospital': '#22c55e', 
      'fire_station': '#f97316',
      'lodging': '#3b82f6'
    };
    const color = colors[type] || '#6b7280';
    return `data:image/svg+xml;base64,${btoa(`<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="10" fill="${color}" stroke="#ffffff" stroke-width="2"/></svg>`)}`;
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'emergency':
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNlZjQ0NDQiLz4KPHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI1IiB5PSI1Ij4KPHA+PC9wPgo8L3N2Zz4KPC9zdmc+';
      case 'location':
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMzYjgyZjYiLz4KPC9zdmc+';
      default:
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMxMGI5ODEiLz4KPC9zdmc+';
    }
  };

  const toggleMapView = () => {
    setShowMap(!showMap);
  };

  const toggleLocationTracker = () => {
    setShowLocationTracker(!showLocationTracker);
  };

  const handleLocationUpdate = (locationData) => {
    console.log('Location updated:', locationData);
    setUserLocation({ lat: locationData.lat, lng: locationData.lng });
    
    // Update map center to user location
    if (map) {
      map.setCenter({ lat: locationData.lat, lng: locationData.lng });
      map.setZoom(15);
      addUserLocationMarker(map, { lat: locationData.lat, lng: locationData.lng });
    }
    
    // Fetch nearby services
    fetchNearbyServices(locationData.lat, locationData.lng);
    
    // Refresh activities to show new location data
    fetchActivities();
  };

  const showActivityOnMap = (activity) => {
    if (activity.location && activity.location.lat && activity.location.lng) {
      setSelectedActivity(activity);
      setShowMap(true);
      
      // Center map on activity location
      if (map) {
        map.setCenter({ lat: activity.location.lat, lng: activity.location.lng });
        map.setZoom(15);
      }
    }
  };

  // Fetch nearby services using Google Places API
  const fetchNearbyServices = (lat, lng) => {
    console.log('Fetching nearby services for:', lat, lng);
    
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }
    
    if (!map) {
      console.error('Map instance not available');
      return;
    }
    
    const service = new window.google.maps.places.PlacesService(map);
    const location = new window.google.maps.LatLng(lat, lng);
    
    const serviceTypes = ['police', 'hospital', 'fire_station', 'lodging'];
    let allServices = [];
    let completedRequests = 0;
    
    console.log('Starting nearby search for types:', serviceTypes);
    
    serviceTypes.forEach(type => {
      const request = {
        location: location,
        radius: 5000, // 5km radius
        type: type
      };
      
      service.nearbySearch(request, (results, status) => {
        completedRequests++;
        console.log(`Search completed for ${type}:`, status, results?.length || 0, 'results');
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const services = results.slice(0, 3).map(place => ({
            id: place.place_id,
            name: place.name,
            type: type,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            distance: calculateDistance(lat, lng, place.geometry.location.lat(), place.geometry.location.lng()).toFixed(1),
            rating: place.rating || 'N/A',
            vicinity: place.vicinity || place.formatted_address || 'Unknown location',
            isOpen: place.opening_hours ? place.opening_hours.open_now : null
          }));
          allServices = [...allServices, ...services];
          console.log(`Added ${services.length} ${type} services`);
        } else {
          console.warn(`No results for ${type}:`, status);
        }
        
        // Update services after all requests complete
        if (completedRequests === serviceTypes.length) {
          console.log('All searches completed. Total services found:', allServices.length);
          setNearbyServices(allServices);
          
          // Don't add fake demo data - show empty state instead
          if (allServices.length === 0) {
            console.log('No services found - showing empty state');
            setNearbyServices([]);
          }
        }
      });
    });
  };
  
  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const refreshFeed = async () => {
    await fetchActivities();
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getColorClasses = (color, priority) => {
    const baseClasses = {
      red: 'bg-red-50 border-red-200 text-red-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      green: 'bg-green-50 border-green-200 text-green-800'
    };

    const iconClasses = {
      red: 'text-red-600 bg-red-100',
      blue: 'text-blue-600 bg-blue-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      green: 'text-green-600 bg-green-100'
    };

    return {
      container: baseClasses[color] || baseClasses.blue,
      icon: iconClasses[color] || iconClasses.blue,
      pulse: priority === 'high' ? 'animate-pulse' : ''
    };
  };
  
  const getServiceIcon = (type) => {
    switch (type) {
      case 'police': return FiShield;
      case 'hospital': return FiPhone;
      case 'fire_station': return FiTruck;
      case 'lodging': return FiHome;
      default: return FiMapPin;
    }
  };
  
  const getServiceColor = (type) => {
    switch (type) {
      case 'police': return 'bg-red-100 text-red-600';
      case 'hospital': return 'bg-green-100 text-green-600';
      case 'fire_station': return 'bg-orange-100 text-orange-600';
      case 'lodging': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="activity-feed mb-6" style={{ minHeight: '600px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Activity Feed</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleLocationTracker}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 
                     text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <FiNavigation className="text-white" />
            <span>{showLocationTracker ? 'Hide Tracker' : 'Track Location'}</span>
          </button>
          <button
            onClick={() => setShowServices(!showServices)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 
                     text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <FiShield className="text-white" />
            <span>{showServices ? 'Hide Services' : 'Show Services'}</span>
          </button>
          <button
            onClick={toggleMapView}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                     text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <FiMap className="text-white" />
            <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
          </button>
          <button
            onClick={refreshFeed}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 
                     rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50"
          >
            <FiRefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-gray-700">Refresh</span>
          </button>
        </div>
      </div>

      {/* Location Tracker Section */}
      {showLocationTracker && (
        <div className="mb-4">
          <LocationTracker 
            onLocationUpdate={handleLocationUpdate}
            emergencyMode={false}
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 lg:max-h-[600px] overflow-hidden relative">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Live Updates</span>
            <span className="text-xs text-gray-500">({activities.length} events)</span>
          </div>
        </div>

        {/* Google Map Section */}
        {showMap && (
          <div className="border-b border-gray-200">
            <div className="p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-800">Activity Locations & Nearby Services</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-blue-600">
                    {activities.filter(a => a.location).length} activities
                  </span>
                  <span className="text-xs text-purple-600">
                    {nearbyServices.length} services
                  </span>
                </div>
              </div>
            </div>
            <div 
              ref={mapRef} 
              style={{ height: '350px', width: '100%' }}
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
            
            {/* Map Info Panel Below Map */}
            <div className="bg-gray-50 border-t border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Location Info */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <FiMapPin className="mr-2 text-blue-600" />
                    Your Location
                  </h4>
                  {userLocation ? (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Lat: {userLocation.lat.toFixed(4)}</div>
                      <div>Lng: {userLocation.lng.toFixed(4)}</div>
                      <div className="text-green-600">📍 Location Active</div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      <div>Location not detected</div>
                      <button 
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const location = {
                                  lat: position.coords.latitude,
                                  lng: position.coords.longitude
                                };
                                setUserLocation(location);
                                if (map) {
                                  map.setCenter(location);
                                  map.setZoom(15);
                                  addUserLocationMarker(map, location);
                                }
                                fetchNearbyServices(location.lat, location.lng);
                              },
                              (error) => console.error('Location error:', error),
                              { enableHighAccuracy: true, timeout: 15000 }
                            );
                          }
                        }}
                        className="mt-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Get Location
                      </button>
                    </div>
                  )}
                </div>

                {/* Services Summary */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <FiShield className="mr-2 text-purple-600" />
                    Emergency Services
                  </h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Total Found: {nearbyServices.length}</div>
                    <div className="flex flex-wrap gap-1">
                      {['police', 'hospital', 'fire_station', 'lodging'].map(type => {
                        const count = nearbyServices.filter(s => s.type === type).length;
                        return count > 0 ? (
                          <span key={type} className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                            {type.replace('_', ' ')}: {count}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <FiNavigation className="mr-2 text-green-600" />
                    Quick Actions
                  </h4>
                  <div className="space-y-1">
                    <button 
                      onClick={() => {
                        if (userLocation && map) {
                          map.setCenter(userLocation);
                          map.setZoom(15);
                        }
                      }}
                      className="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                    >
                      📍 Center on Me
                    </button>
                    <button 
                      onClick={() => {
                        if (nearbyServices.length > 0 && map) {
                          const bounds = new window.google.maps.LatLngBounds();
                          nearbyServices.forEach(service => {
                            bounds.extend(new window.google.maps.LatLng(service.lat, service.lng));
                          });
                          if (userLocation) {
                            bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
                          }
                          map.fitBounds(bounds);
                        }
                      }}
                      className="w-full text-left px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                    >
                      🗺️ Show All Services
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-y-auto max-h-96 lg:max-h-[500px]" style={{ minHeight: '300px' }}>
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((index) => (
                <div key={index} className="animate-pulse flex items-start space-x-3">
                  <div className="bg-gray-200 w-10 h-10 rounded-full"></div>
                  <div className="flex-1">
                    <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiClock className="mx-auto text-3xl mb-2" />
              <p>No recent activities</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const colorClasses = getColorClasses(activity.color, activity.priority);
                
                return (
                  <div
                    key={activity.id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${colorClasses.pulse}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`
                        p-2 rounded-lg ${colorClasses.icon} flex-shrink-0
                      `}>
                        <Icon className="text-lg" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-800 truncate">
                            {activity.title}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {getTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className={`
                              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                              ${colorClasses.container}
                            `}>
                              {activity.type.toUpperCase()}
                            </span>
                            {activity.location && (
                              <button
                                onClick={() => showActivityOnMap(activity)}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                         bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                              >
                                <FiMapPin className="mr-1" />
                                View Location
                              </button>
                            )}
                          </div>
                          
                          <span className="text-xs text-gray-400">
                            {activity.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activities.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All Activities →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
