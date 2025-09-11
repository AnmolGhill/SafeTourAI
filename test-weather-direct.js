const axios = require('axios');

// Test OpenWeatherMap API directly without our server
async function testWeatherDirect() {
  const API_KEY = '7a80dbbd1a146bf2ff4fc17dfd91f0a4';
  const lat = 28.6139;
  const lng = 77.2090;
  
  console.log('🌤️  Testing OpenWeatherMap API directly...');
  console.log('🔑 API Key:', `${API_KEY.substring(0, 8)}...`);
  
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
    console.log('🔗 Direct API Call:', url);
    
    const response = await axios.get(url);
    
    console.log('✅ SUCCESS! Weather API Response:');
    console.log({
      location: response.data.name,
      country: response.data.sys.country,
      temperature: `${response.data.main.temp}°C`,
      condition: response.data.weather[0].main,
      description: response.data.weather[0].description,
      humidity: `${response.data.main.humidity}%`,
      windSpeed: `${response.data.wind.speed} m/s`
    });
    
  } catch (error) {
    console.log('❌ FAILED! Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      cod: error.response?.data?.cod
    });
    
    if (error.response?.status === 401) {
      console.log('💡 Suggestions:');
      console.log('   - Wait 10-15 minutes for API key activation');
      console.log('   - Verify your OpenWeatherMap account email');
      console.log('   - Check if you need to subscribe to a plan');
    }
  }
}

testWeatherDirect();
