import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL 
  ? `${import.meta.env.VITE_BASE_URL}/api` 
  : 'http://localhost:5000/api';

// Create axios instance with default config
const safetyAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
safetyAPI.interceptors.request.use(
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
safetyAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Safety API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const safetyService = {
  // Get comprehensive safety analysis for location
  async getSafetyAnalysis(lat, lng, activityType = 'general') {
    try {
      const response = await safetyAPI.post('/maps/safety-analysis', {
        lat,
        lng,
        activityType
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Safety analysis error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get safety analysis'
      };
    }
  },

  // Get current weather for location
  async getCurrentWeather(lat, lng) {
    try {
      const response = await safetyAPI.post('/weather/current', { lat, lng });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Weather error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get weather data'
      };
    }
  },

  // Get nearby emergency services
  async getNearbyServices(lat, lng, radius = 5000, types = ['hospital', 'police', 'fire_station']) {
    try {
      const response = await safetyAPI.post('/maps/nearby-services', {
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
        error: error.response?.data?.message || 'Failed to get nearby services'
      };
    }
  },

  // Get user's current location with enhanced accuracy
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      console.log('🗺️ Requesting high-accuracy location...');

      // First try with high accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location obtained:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString()
          });
          
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.error('❌ High-accuracy location failed:', error);
          
          // Fallback to lower accuracy if high accuracy fails
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('⚠️ Using lower accuracy location:', {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
              });
              
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
              });
            },
            (fallbackError) => {
              let errorMessage = 'Failed to get location';
              switch (fallbackError.code) {
                case fallbackError.PERMISSION_DENIED:
                  errorMessage = 'Location access denied by user. Please enable location permissions.';
                  break;
                case fallbackError.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable. Check GPS/network connection.';
                  break;
                case fallbackError.TIMEOUT:
                  errorMessage = 'Location request timed out. Try again.';
                  break;
              }
              console.error('❌ Location error:', errorMessage);
              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: false, // Lower accuracy fallback
              timeout: 8000, // Shorter timeout for fallback
              maximumAge: 300000 // 5 minute cache for fallback
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Reduced timeout to prevent hanging
          maximumAge: 60000 // 1 minute cache for fresh location
        }
      );
    });
  },

  // Calculate safety score based on multiple factors
  calculateSafetyScore(weatherData, emergencyServices, locationData) {
    let score = 50; // Base score
    const factors = [];

    // Weather factors (40% weight)
    if (weatherData) {
      const weatherScore = weatherData.riskAssessment?.overallRisk || 50;
      const weatherContribution = (100 - weatherScore) * 0.4;
      score += weatherContribution - 20; // Adjust base
      factors.push({
        name: 'Weather Conditions',
        score: 100 - weatherScore,
        weight: 40,
        details: weatherData.riskAssessment?.recommendations || []
      });
    }

    // Emergency services availability (40% weight)
    if (emergencyServices?.services) {
      const serviceCount = emergencyServices.services.length;
      const serviceScore = Math.min(serviceCount * 8, 40); // Max 40 points
      score += serviceScore - 20; // Adjust base
      
      const serviceTypes = {
        hospital: emergencyServices.services.filter(s => s.type === 'hospital').length,
        police: emergencyServices.services.filter(s => s.type === 'police').length,
        fire_station: emergencyServices.services.filter(s => s.type === 'fire_station').length
      };

      factors.push({
        name: 'Emergency Services',
        score: serviceScore * 2.5, // Convert to percentage
        weight: 40,
        details: [
          `${serviceTypes.hospital} hospitals nearby`,
          `${serviceTypes.police} police stations nearby`,
          `${serviceTypes.fire_station} fire stations nearby`
        ]
      });
    }

    // Location factors (20% weight)
    if (locationData) {
      const locationScore = 20; // Base location score
      score += locationScore - 10; // Adjust base
      factors.push({
        name: 'Location Safety',
        score: locationScore * 5, // Convert to percentage
        weight: 20,
        details: ['Urban area with infrastructure']
      });
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      overallScore: score,
      riskLevel: this.getRiskLevel(score),
      factors,
      recommendations: this.generateRecommendations(score, factors)
    };
  },

  // Get risk level based on score
  getRiskLevel(score) {
    if (score >= 80) return 'low';
    if (score >= 60) return 'moderate';
    if (score >= 40) return 'high';
    return 'critical';
  },

  // Generate safety recommendations
  generateRecommendations(score, factors) {
    const recommendations = [];

    if (score < 60) {
      recommendations.push('Consider traveling with a companion');
      recommendations.push('Keep emergency contacts readily available');
      recommendations.push('Share your location with trusted contacts');
    }

    if (score < 40) {
      recommendations.push('Avoid traveling alone');
      recommendations.push('Consider postponing non-essential travel');
    }

    // Add factor-specific recommendations
    factors.forEach(factor => {
      if (factor.details) {
        recommendations.push(...factor.details);
      }
    });

    recommendations.push('Keep your phone charged and carry a power bank');
    recommendations.push('Stay aware of your surroundings');

    return [...new Set(recommendations)]; // Remove duplicates
  },

  // Get safety score color for UI
  getSafetyScoreColor(score) {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  },

  // Get risk level color for UI
  getRiskLevelColor(riskLevel) {
    const colors = {
      'low': 'text-green-600 bg-green-100',
      'moderate': 'text-yellow-600 bg-yellow-100',
      'high': 'text-orange-600 bg-orange-100',
      'critical': 'text-red-600 bg-red-100'
    };
    return colors[riskLevel] || 'text-gray-600 bg-gray-100';
  }
};

export default safetyService;
