/**
 * Geofencing Service - Real-time user location monitoring against restricted areas
 * Handles polygon and circle geofence detection
 */

export const geofencingService = {
  /**
   * Check if a point is inside a polygon using ray casting algorithm
   * @param {Object} point - {lat, lng}
   * @param {Array} polygon - Array of {lat, lng} points
   * @returns {boolean}
   */
  isPointInPolygon(point, polygon) {
    if (!point || !polygon || polygon.length < 3) return false;

    const { lat, lng } = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;

      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  },

  /**
   * Calculate distance between two points using Haversine formula
   * @param {Object} point1 - {lat, lng}
   * @param {Object} point2 - {lat, lng}
   * @returns {number} Distance in meters
   */
  calculateDistance(point1, point2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Check if a point is inside a circle
   * @param {Object} point - {lat, lng}
   * @param {Object} center - {lat, lng}
   * @param {number} radius - Radius in meters
   * @returns {boolean}
   */
  isPointInCircle(point, center, radius) {
    if (!point || !center || !radius) return false;

    const distance = this.calculateDistance(point, center);
    return distance <= radius;
  },

  /**
   * Check if user is in any restricted area
   * @param {Object} userLocation - {lat, lng}
   * @param {Array} restrictedAreas - Array of area objects
   * @returns {Array} Array of areas the user is in
   */
  checkRestrictedAreas(userLocation, restrictedAreas) {
    if (!userLocation || !Array.isArray(restrictedAreas)) {
      return [];
    }

    const areasInside = [];

    restrictedAreas.forEach(area => {
      if (!area.active) return;

      let isInside = false;

      if (area.type === 'polygon' && area.polygon && area.polygon.length > 0) {
        isInside = this.isPointInPolygon(userLocation, area.polygon);
      } else if (area.type === 'circle' && area.center && area.radius) {
        isInside = this.isPointInCircle(userLocation, area.center, area.radius);
      }

      if (isInside) {
        areasInside.push(area);
      }
    });

    return areasInside;
  },

  /**
   * Start continuous geofencing monitoring
   * @param {Function} onLocationUpdate - Callback with location data
   * @param {Object} options - Geolocation options
   * @returns {number} Watch ID for stopping later
   */
  startGeofencingWatch(onLocationUpdate, options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const finalOptions = { ...defaultOptions, ...options };

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        };

        onLocationUpdate(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      finalOptions
    );

    return watchId;
  },

  /**
   * Stop geofencing watch
   * @param {number} watchId - Watch ID from startGeofencingWatch
   */
  stopGeofencingWatch(watchId) {
    if (watchId !== null && watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  /**
   * Get current user location once
   * @param {Object} options - Geolocation options
   * @returns {Promise} Promise resolving to location object
   */
  getCurrentLocation(options = {}) {
    return new Promise((resolve, reject) => {
      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      };

      const finalOptions = { ...defaultOptions, ...options };

      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        finalOptions
      );
    });
  }
};
