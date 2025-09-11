const axios = require('axios');

// Simple test without authentication to trigger API logs
async function testAPIs() {
  console.log('🧪 Testing APIs - Check server console for detailed logs...\n');
  
  const testCoords = {
    lat: 28.6139, // New Delhi
    lng: 77.2090
  };
  
  // Test Weather API
  console.log('🌤️  Testing Weather API...');
  try {
    await axios.post('http://localhost:5000/api/weather/current', {
      lat: testCoords.lat,
      lng: testCoords.lng
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.log('Expected auth error - check server logs for Weather API calls');
  }
  
  // Test Google Maps API
  console.log('🗺️  Testing Google Maps API...');
  try {
    await axios.post('http://localhost:5000/api/maps/nearby-services', {
      lat: testCoords.lat,
      lng: testCoords.lng,
      radius: 5000,
      types: ['hospital', 'police']
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.log('Expected auth error - check server logs for Google Maps API calls');
  }
  
  console.log('\n✅ Test complete! Check your server console for detailed API logs.');
}

testAPIs();
