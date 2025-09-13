const axios = require('axios');

// Test Weather API directly
async function testWeatherAPI() {
  console.log('🌤️  Testing OpenWeatherMap API...');
  
  const testCoords = {
    lat: 28.6139, // New Delhi
    lng: 77.2090
  };
  
  try {
    const response = await axios.post('http://localhost:5000/api/weather/current', {
      lat: testCoords.lat,
      lng: testCoords.lng
    }, {
      headers: {
        'Authorization': 'Bearer test-token', // This will fail auth but show API logs
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Weather API Response:', response.data);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('🔐 Authentication failed (expected) - but check server logs for API calls');
    } else {
      console.log('❌ Weather API Error:', error.response?.data || error.message);
    }
  }
}

testWeatherAPI();
