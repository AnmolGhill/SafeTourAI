import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com/api' 
  : 'http://localhost:5000/api';

// Create axios instance with default config
const mapsAPI = axios.create({
  baseURL: `${API_BASE_URL}/maps`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
mapsAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
mapsAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Maps API Error:', error);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const mapsService = {
  // Geocode place name to coordinates
  async geocodePlace(address) {
    try {
      const response = await mapsAPI.post('/geocode', { address });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to geocode location'
      };
    }
  },

  // Reverse geocode coordinates to address
  async reverseGeocode(lat, lng) {
    try {
      const response = await mapsAPI.post('/reverse-geocode', { lat, lng });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reverse geocode coordinates'
      };
    }
  },

  // Get nearby emergency services
  async getNearbyServices(lat, lng, options = {}) {
    try {
      const {
        radius = 5000,
        types = ['police', 'hospital', 'fire_station', 'lodging']
      } = options;

      const response = await mapsAPI.post('/nearby-services', {
        lat,
        lng,
        radius,
        types
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Nearby services error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch nearby services',
        fallbackData: this.getFallbackServices(lat, lng)
      };
    }
  },

  // Get place details by place ID
  async getPlaceDetails(placeId) {
    try {
      const response = await mapsAPI.get(`/place-details/${placeId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Place details error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch place details'
      };
    }
  },

  // Get safety analysis for location
  async getSafetyAnalysis(lat, lng, options = {}) {
    try {
      const response = await mapsAPI.post('/safety-analysis', {
        lat,
        lng,
        ...options
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Safety analysis error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to perform safety analysis'
      };
    }
  },

  // Remove fallback services - no fake data
  getFallbackServices(lat, lng) {
    console.warn('⚠️ Fallback services requested but disabled to prevent fake location data');
    return {
      services: [],
      location: { lat, lng },
      radius: 5000,
      totalFound: 0
    };
  },

  // Calculate distance between two points
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Get user's current location
  async getCurrentLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      };

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
          let errorMessage = 'Location access failed';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
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
          
          reject(new Error(errorMessage));
        },
        { ...defaultOptions, ...options }
      );
    });
  }
};

export default mapsService;
