import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com/api' 
  : 'http://localhost:5000/api';

// Create axios instance with default config
const weatherAPI = axios.create({
  baseURL: `${API_BASE_URL}/weather`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
weatherAPI.interceptors.request.use(
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
weatherAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Weather API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const weatherService = {
  // Get current weather for location
  async getCurrentWeather(lat, lng) {
    try {
      const response = await weatherAPI.post('/current', { lat, lng });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Current weather error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch current weather'
      };
    }
  },

  // Get 5-day weather forecast
  async getWeatherForecast(lat, lng) {
    try {
      const response = await weatherAPI.post('/forecast', { lat, lng });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Weather forecast error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch weather forecast'
      };
    }
  },

  // Get weather alerts for location
  async getWeatherAlerts(lat, lng) {
    try {
      const response = await weatherAPI.post('/alerts', { lat, lng });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Weather alerts error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch weather alerts'
      };
    }
  },

  // Get weather-based safety analysis
  async getWeatherSafetyAnalysis(lat, lng, activityType = 'general') {
    try {
      const response = await weatherAPI.post('/safety-analysis', {
        lat,
        lng,
        activityType
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Weather safety analysis error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to perform weather safety analysis'
      };
    }
  },

  // Get weather condition icon URL
  getWeatherIconUrl(iconCode, size = '2x') {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
  },

  // Format temperature with unit
  formatTemperature(temp, unit = 'C') {
    return `${Math.round(temp)}°${unit}`;
  },

  // Get weather condition color for UI
  getWeatherConditionColor(condition) {
    const colors = {
      'Clear': 'text-yellow-500',
      'Clouds': 'text-gray-500',
      'Rain': 'text-blue-500',
      'Drizzle': 'text-blue-400',
      'Thunderstorm': 'text-purple-600',
      'Snow': 'text-blue-200',
      'Mist': 'text-gray-400',
      'Fog': 'text-gray-400',
      'Haze': 'text-yellow-300'
    };
    return colors[condition] || 'text-gray-500';
  },

  // Get risk level color for UI
  getRiskLevelColor(riskLevel) {
    const colors = {
      'minimal': 'text-green-600 bg-green-100',
      'low': 'text-green-600 bg-green-100',
      'moderate': 'text-yellow-600 bg-yellow-100',
      'high': 'text-orange-600 bg-orange-100',
      'critical': 'text-red-600 bg-red-100'
    };
    return colors[riskLevel] || 'text-gray-600 bg-gray-100';
  },

  // Convert wind speed to readable format
  formatWindSpeed(speed, unit = 'm/s') {
    if (unit === 'kmh') {
      return `${Math.round(speed * 3.6)} km/h`;
    }
    return `${Math.round(speed)} m/s`;
  },

  // Get wind direction from degrees
  getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  },

  // Check if weather is suitable for outdoor activities
  isWeatherSuitableForOutdoor(weatherData) {
    if (!weatherData) return { suitable: false, reason: 'No weather data available' };

    const { current } = weatherData;
    
    // Check for severe conditions
    if (current.condition.includes('Thunderstorm')) {
      return { suitable: false, reason: 'Thunderstorm conditions' };
    }
    
    if (current.condition.includes('Snow') && current.temperature < 0) {
      return { suitable: false, reason: 'Heavy snow and freezing temperatures' };
    }
    
    if (current.temperature > 35) {
      return { suitable: false, reason: 'Extreme heat' };
    }
    
    if (current.temperature < -10) {
      return { suitable: false, reason: 'Extreme cold' };
    }
    
    if (weatherData.wind && weatherData.wind.speed > 15) {
      return { suitable: false, reason: 'High wind speeds' };
    }
    
    if (current.visibility < 1) {
      return { suitable: false, reason: 'Poor visibility' };
    }
    
    return { suitable: true, reason: 'Weather conditions are suitable' };
  }
};

export default weatherService;
