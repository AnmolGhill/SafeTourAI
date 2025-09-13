import React, { useState, useEffect } from 'react';
import { 
  FiMapPin, 
  FiPhone, 
  FiShield, 
  FiHome, 
  FiTruck,
  FiNavigation,
  FiStar,
  FiClock,
  FiExternalLink,
  FiRefreshCw
} from 'react-icons/fi';
import mapsService from '../../services/mapsService';
import { addDistancesToServices, sortServicesByDistance, getUserReferenceLocation } from '../../utils/distanceCalculator';

const ServicesWidget = () => {
  const [nearbyServices, setNearbyServices] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get service icon based on type
  const getServiceIcon = (type) => {
    switch (type) {
      case 'police': return FiShield;
      case 'hospital': return FiPhone;
      case 'fire_station': return FiTruck;
      case 'lodging': return FiHome;
      default: return FiMapPin;
    }
  };

  // Get service color based on type
  const getServiceColor = (type) => {
    switch (type) {
      case 'police': return 'bg-blue-100 text-blue-600';
      case 'hospital': return 'bg-red-100 text-red-600';
      case 'fire_station': return 'bg-orange-100 text-orange-600';
      case 'lodging': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
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

  // Fetch nearby services using backend API
  const fetchNearbyServices = async (lat, lng) => {
    setLoading(true);
    
    try {
      const result = await mapsService.getNearbyServices(lat, lng, {
        radius: 5000,
        types: ['police', 'hospital', 'fire_station', 'lodging']
      });
      
      if (result.success) {
        // Add distance calculations to services
        const servicesWithDistance = addDistancesToServices(result.data.services);
        const sortedServices = sortServicesByDistance(servicesWithDistance);
        setNearbyServices(sortedServices);
      } else {
        setNearbyServices([]);
        console.warn('Services API failed:', result.error);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      // Don't use fake fallback data
      setNearbyServices([]);
      setError('Failed to load emergency services. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get user location using maps service
  const getUserLocation = async () => {
    setLoading(true);
    
    try {
      const location = await mapsService.getCurrentLocation();
      setUserLocation(location);
      await fetchNearbyServices(location.lat, location.lng);
    } catch (error) {
      console.error('Location error:', error);
      setLoading(false);
      
      // Don't use fake fallback data - show empty state instead
      setNearbyServices([]);
      
      // Show user-friendly message
      if (error.message.includes('denied')) {
        setError('Location access denied. Please enable location permissions to find nearby emergency services.');
      } else {
        setError('Unable to get your location. Please check your GPS/network connection and try again.');
      }
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiMapPin className="text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Emergency Services</h3>
        </div>
        <button
          onClick={getUserLocation}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Finding...</span>
            </>
          ) : (
            <>
              <FiNavigation className="w-4 h-4" />
              <span>Show Services</span>
            </>
          )}
        </button>
      </div>

      {nearbyServices.length === 0 && !loading ? (
        <div className="text-center py-8">
          <FiMapPin className="mx-auto text-4xl text-gray-400 mb-3" />
          <p className="text-gray-500 mb-4">Discover nearby emergency services</p>
          <p className="text-sm text-gray-400">Click "Show Services" to see emergency services in your area</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nearbyServices.slice(0, 4).map((service, index) => {
            const ServiceIcon = getServiceIcon(service.type);
            return (
              <div key={service.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-full ${getServiceColor(service.type)} flex-shrink-0`}>
                  <ServiceIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {service.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{service.distance}km away</span>
                    {service.rating !== 'N/A' && (
                      <>
                        <span>•</span>
                        <div className="flex items-center">
                          <FiStar className="w-3 h-3 text-yellow-500 mr-1" />
                          <span>{service.rating}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 p-1">
                  <FiExternalLink className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          
          {nearbyServices.length > 4 && (
            <div className="text-center pt-2">
              <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                View all {nearbyServices.length} services →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServicesWidget;
