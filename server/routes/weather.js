const express = require('express');
const axios = require('axios');
const { verifyFirebaseToken } = require('../middleware/auth');
const router = express.Router();

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Current weather endpoint (temporarily without auth for testing)
router.post('/current', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    console.log('🌤️  Weather API Request:', { lat, lng });
    
    if (!lat || !lng) {
      console.log('❌ Weather API Error: Missing coordinates');
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const weatherUrl = `${OPENWEATHER_BASE_URL}/weather`;
    console.log('🔗 OpenWeatherMap API Call:', weatherUrl);
    console.log('🔑 Using API Key:', OPENWEATHER_API_KEY ? `${OPENWEATHER_API_KEY.substring(0, 8)}...` : 'NOT SET');
    
    const response = await axios.get(weatherUrl, {
      params: {
        lat: lat,
        lon: lng,
        appid: OPENWEATHER_API_KEY,
        units: 'metric' // Celsius
      }
    });
    
    console.log('✅ OpenWeatherMap API Response Status:', response.status);
    console.log('📊 Weather Data Retrieved:', {
      location: response.data.name,
      temperature: response.data.main.temp,
      condition: response.data.weather[0].main,
      description: response.data.weather[0].description
    });
    
    const weatherData = response.data;
    
    res.json({
      success: true,
      data: {
        location: {
          name: weatherData.name,
          country: weatherData.sys.country,
          coordinates: { lat, lng }
        },
        current: {
          temperature: weatherData.main.temp,
          feelsLike: weatherData.main.feels_like,
          humidity: weatherData.main.humidity,
          pressure: weatherData.main.pressure,
          visibility: weatherData.visibility / 1000, // Convert to km
          uvIndex: null, // Not available in current weather API
          condition: weatherData.weather[0].main,
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon
        },
        wind: {
          speed: weatherData.wind.speed,
          direction: weatherData.wind.deg,
          gust: weatherData.wind.gust || null
        },
        clouds: {
          coverage: weatherData.clouds.all
        },
        precipitation: {
          rain1h: weatherData.rain ? weatherData.rain['1h'] : 0,
          snow1h: weatherData.snow ? weatherData.snow['1h'] : 0
        },
        sun: {
          sunrise: new Date(weatherData.sys.sunrise * 1000).toISOString(),
          sunset: new Date(weatherData.sys.sunset * 1000).toISOString()
        },
        timestamp: new Date(weatherData.dt * 1000).toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ OpenWeatherMap API Error:', error.response?.data || error.message);
    console.error('🔍 Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current weather',
      error: error.response?.data?.message || error.message
    });
  }
});

// 5-day forecast endpoint
router.post('/forecast', verifyFirebaseToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast`;
    
    const response = await axios.get(forecastUrl, {
      params: {
        lat: lat,
        lon: lng,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });
    
    const forecastData = response.data;
    
    // Process forecast data
    const dailyForecasts = {};
    
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date: date,
          temperatures: [],
          conditions: [],
          precipitation: 0,
          windSpeeds: [],
          humidity: []
        };
      }
      
      dailyForecasts[date].temperatures.push(item.main.temp);
      dailyForecasts[date].conditions.push(item.weather[0].main);
      dailyForecasts[date].windSpeeds.push(item.wind.speed);
      dailyForecasts[date].humidity.push(item.main.humidity);
      
      if (item.rain) {
        dailyForecasts[date].precipitation += item.rain['3h'] || 0;
      }
      if (item.snow) {
        dailyForecasts[date].precipitation += item.snow['3h'] || 0;
      }
    });
    
    // Calculate daily summaries
    const processedForecast = Object.values(dailyForecasts).map(day => ({
      date: day.date,
      temperature: {
        min: Math.min(...day.temperatures),
        max: Math.max(...day.temperatures),
        avg: day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length
      },
      condition: getMostFrequent(day.conditions),
      precipitation: day.precipitation,
      wind: {
        avg: day.windSpeeds.reduce((a, b) => a + b, 0) / day.windSpeeds.length,
        max: Math.max(...day.windSpeeds)
      },
      humidity: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length
    }));
    
    res.json({
      success: true,
      data: {
        location: {
          name: forecastData.city.name,
          country: forecastData.city.country,
          coordinates: { lat, lng }
        },
        forecast: processedForecast.slice(0, 5), // 5 days
        rawData: forecastData.list.slice(0, 10) // Next 10 3-hour periods for detailed analysis
      }
    });
    
  } catch (error) {
    console.error('Weather forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather forecast',
      error: error.response?.data?.message || error.message
    });
  }
});

// Weather alerts endpoint
router.post('/alerts', verifyFirebaseToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    // Use One Call API for alerts (requires different endpoint)
    const oneCallUrl = `${OPENWEATHER_BASE_URL}/onecall`;
    
    const response = await axios.get(oneCallUrl, {
      params: {
        lat: lat,
        lon: lng,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        exclude: 'minutely,hourly' // Only get current, daily, and alerts
      }
    });
    
    const data = response.data;
    
    res.json({
      success: true,
      data: {
        location: { lat, lng },
        alerts: data.alerts || [],
        current: {
          temperature: data.current.temp,
          condition: data.current.weather[0].main,
          windSpeed: data.current.wind_speed,
          uvIndex: data.current.uvi
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Weather alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather alerts',
      error: error.response?.data?.message || error.message
    });
  }
});

// Weather-based safety analysis
router.post('/safety-analysis', verifyFirebaseToken, async (req, res) => {
  try {
    const { lat, lng, activityType = 'general' } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    // Get current weather and forecast
    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: { lat, lon: lng, appid: OPENWEATHER_API_KEY, units: 'metric' }
      }),
      axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
        params: { lat, lon: lng, appid: OPENWEATHER_API_KEY, units: 'metric' }
      })
    ]);
    
    const current = currentResponse.data;
    const forecast = forecastResponse.data;
    
    // Calculate weather-based risk factors
    const riskFactors = calculateWeatherRisks(current, forecast, activityType);
    
    res.json({
      success: true,
      data: {
        location: {
          name: current.name,
          coordinates: { lat, lng }
        },
        currentWeather: {
          temperature: current.main.temp,
          condition: current.weather[0].main,
          description: current.weather[0].description,
          windSpeed: current.wind.speed,
          visibility: current.visibility / 1000,
          humidity: current.main.humidity
        },
        riskAssessment: {
          overallRisk: riskFactors.overallRisk,
          riskLevel: getRiskLevel(riskFactors.overallRisk),
          factors: riskFactors.factors,
          recommendations: riskFactors.recommendations
        },
        forecast: forecast.list.slice(0, 8).map(item => ({
          time: new Date(item.dt * 1000).toISOString(),
          temperature: item.main.temp,
          condition: item.weather[0].main,
          windSpeed: item.wind.speed,
          precipitation: (item.rain ? item.rain['3h'] : 0) + (item.snow ? item.snow['3h'] : 0)
        })),
        analysisTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Weather safety analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform weather safety analysis',
      error: error.response?.data?.message || error.message
    });
  }
});

// Helper function to get most frequent item in array
function getMostFrequent(arr) {
  const frequency = {};
  let maxCount = 0;
  let mostFrequent = arr[0];
  
  arr.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxCount) {
      maxCount = frequency[item];
      mostFrequent = item;
    }
  });
  
  return mostFrequent;
}

// Calculate weather-based risk factors
function calculateWeatherRisks(current, forecast, activityType) {
  let riskScore = 0;
  const factors = [];
  const recommendations = [];
  
  // Temperature risks
  if (current.main.temp < 0) {
    riskScore += 30;
    factors.push('Freezing temperatures detected');
    recommendations.push('Dress warmly and be aware of ice hazards');
  } else if (current.main.temp > 35) {
    riskScore += 25;
    factors.push('Extreme heat detected');
    recommendations.push('Stay hydrated and seek shade regularly');
  }
  
  // Wind risks
  if (current.wind.speed > 15) {
    riskScore += 20;
    factors.push('High wind speeds');
    recommendations.push('Be cautious of falling objects and unstable structures');
  }
  
  // Visibility risks
  if (current.visibility < 1000) {
    riskScore += 25;
    factors.push('Poor visibility conditions');
    recommendations.push('Use extra caution when traveling');
  }
  
  // Precipitation risks
  const hasRain = current.weather[0].main.includes('Rain');
  const hasSnow = current.weather[0].main.includes('Snow');
  const hasStorm = current.weather[0].main.includes('Thunderstorm');
  
  if (hasStorm) {
    riskScore += 40;
    factors.push('Thunderstorm conditions');
    recommendations.push('Seek indoor shelter immediately');
  } else if (hasSnow) {
    riskScore += 30;
    factors.push('Snow conditions');
    recommendations.push('Drive carefully and wear appropriate footwear');
  } else if (hasRain) {
    riskScore += 15;
    factors.push('Rainy conditions');
    recommendations.push('Carry umbrella and be cautious of slippery surfaces');
  }
  
  // Activity-specific risks
  if (activityType === 'outdoor') {
    if (current.main.humidity > 80) {
      riskScore += 10;
      factors.push('High humidity levels');
    }
  }
  
  // Forecast-based risks (next 24 hours)
  const next24h = forecast.list.slice(0, 8);
  const hasUpcomingStorms = next24h.some(item => 
    item.weather[0].main.includes('Thunderstorm')
  );
  
  if (hasUpcomingStorms) {
    riskScore += 20;
    factors.push('Storms expected in next 24 hours');
    recommendations.push('Monitor weather updates and plan indoor alternatives');
  }
  
  return {
    overallRisk: Math.min(riskScore, 100),
    factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Current weather conditions are generally safe']
  };
}

function getRiskLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'low';
  return 'minimal';
}

module.exports = router;
