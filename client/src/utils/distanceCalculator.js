// Distance calculation utilities

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
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

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};

/**
 * Get user's reference location from localStorage
 * @returns {object|null} User location object or null
 */
export const getUserReferenceLocation = () => {
  try {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      const location = JSON.parse(stored);
      // Check if location is not too old (24 hours)
      if (Date.now() - location.timestamp < 24 * 60 * 60 * 1000) {
        return location;
      }
    }
  } catch (error) {
    console.error('Error getting user reference location:', error);
  }
  return null;
};

/**
 * Calculate distance from user's reference location to a target
 * @param {number} targetLat - Target latitude
 * @param {number} targetLng - Target longitude
 * @returns {string|null} Formatted distance or null if no reference location
 */
export const getDistanceFromUser = (targetLat, targetLng) => {
  const userLocation = getUserReferenceLocation();
  if (!userLocation) {
    return null;
  }
  
  const distance = calculateDistance(
    userLocation.lat, 
    userLocation.lng, 
    targetLat, 
    targetLng
  );
  
  return formatDistance(distance);
};

/**
 * Add distance information to a list of services
 * @param {Array} services - Array of service objects with lat/lng
 * @returns {Array} Services with distance information added
 */
export const addDistancesToServices = (services) => {
  const userLocation = getUserReferenceLocation();
  
  return services.map(service => {
    let distance = null;
    let distanceKm = null;
    
    if (userLocation && service.lat && service.lng) {
      distanceKm = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        service.lat,
        service.lng
      );
      distance = formatDistance(distanceKm);
    }
    
    return {
      ...service,
      distance,
      distanceKm,
      userLocation: userLocation ? {
        lat: userLocation.lat,
        lng: userLocation.lng
      } : null
    };
  });
};

/**
 * Sort services by distance from user location
 * @param {Array} services - Array of services with distance information
 * @returns {Array} Services sorted by distance (closest first)
 */
export const sortServicesByDistance = (services) => {
  return services.sort((a, b) => {
    // Services with distance come first
    if (a.distanceKm && !b.distanceKm) return -1;
    if (!a.distanceKm && b.distanceKm) return 1;
    if (!a.distanceKm && !b.distanceKm) return 0;
    
    // Sort by distance
    return a.distanceKm - b.distanceKm;
  });
};
