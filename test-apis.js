const axios = require('axios');
require('dotenv').config();

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const TEST_COORDINATES = {
  lat: 28.6139, // New Delhi coordinates for testing
  lng: 77.2090
};

// Mock JWT token for testing (you'll need to replace with a real token)
const TEST_TOKEN = 'your-jwt-token-here';

console.log('🧪 Starting API Tests...\n');

// Test Weather API
async function testWeatherAPI() {
  console.log('🌤️  Testing OpenWeatherMap API Integration...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/api/weather/current`, {
      lat: TEST_COORDINATES.lat,
      lng: TEST_COORDINATES.lng
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Weather API Test Successful!');
    console.log('📊 Response:', {
      location: response.data.data.location.name,
      temperature: response.data.data.current.temperature,
      condition: response.data.data.current.condition
    });
    
  } catch (error) {
    console.log('❌ Weather API Test Failed:');
    console.log('Error:', error.response?.data || error.message);
  }
  
  console.log(''); // Empty line for spacing
}

// Test Google Maps API
async function testGoogleMapsAPI() {
  console.log('🗺️  Testing Google Maps API Integration...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/api/maps/nearby-services`, {
      lat: TEST_COORDINATES.lat,
      lng: TEST_COORDINATES.lng,
      radius: 5000,
      types: ['hospital', 'police']
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Google Maps API Test Successful!');
    console.log('📊 Response:', {
      totalServices: response.data.data.totalFound,
      services: response.data.data.services.map(s => ({
        name: s.name,
        type: s.type,
        distance: `${s.distance.toFixed(2)}km`
      }))
    });
    
  } catch (error) {
    console.log('❌ Google Maps API Test Failed:');
    console.log('Error:', error.response?.data || error.message);
  }
  
  console.log(''); // Empty line for spacing
}

// Test Safety Analysis (combines both APIs)
async function testSafetyAnalysis() {
  console.log('🛡️  Testing Combined Safety Analysis...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/api/maps/safety-analysis`, {
      lat: TEST_COORDINATES.lat,
      lng: TEST_COORDINATES.lng,
      activityType: 'outdoor'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Safety Analysis Test Successful!');
    console.log('📊 Response:', {
      overallScore: response.data.data.safetyScore.overallScore,
      weatherScore: response.data.data.safetyScore.weatherScore,
      infrastructureScore: response.data.data.safetyScore.infrastructureScore,
      riskLevel: response.data.data.riskLevel,
      totalRecommendations: response.data.data.recommendations.length
    });
    
  } catch (error) {
    console.log('❌ Safety Analysis Test Failed:');
    console.log('Error:', error.response?.data || error.message);
  }
  
  console.log(''); // Empty line for spacing
}

// Run all tests
async function runTests() {
  console.log(`🎯 Testing APIs with coordinates: ${TEST_COORDINATES.lat}, ${TEST_COORDINATES.lng}`);
  console.log(`🔗 Server URL: ${SERVER_URL}`);
  console.log('⚠️  Note: Make sure your server is running and you have a valid JWT token!\n');
  
  await testWeatherAPI();
  await testGoogleMapsAPI();
  await testSafetyAnalysis();
  
  console.log('🏁 API Tests Complete!');
  console.log('\n📝 Instructions:');
  console.log('1. Start your server: npm start (in server directory)');
  console.log('2. Replace TEST_TOKEN with a valid JWT token');
  console.log('3. Run this test: node test-apis.js');
  console.log('4. Check server console for detailed API logs');
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWeatherAPI, testGoogleMapsAPI, testSafetyAnalysis };
