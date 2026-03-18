// Test script to verify domain configuration
const testUrls = [
  'https://safetour.live',      // Frontend domain
  'https://api.safetour.live',  // Backend domain
  'https://safetour.live/api',  // Frontend with API path
  'https://api.safetour.live/api' // Backend with API path
];

async function testDomainConnectivity() {
  console.log('🔍 Testing domain connectivity...\n');
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        }
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
          const text = await response.text();
          console.log(`   Response: ${text.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('---\n');
  }
}

// Test CORS specifically
async function testCORS() {
  console.log('🌐 Testing CORS configuration...\n');
  
  const testUrl = 'https://api.safetour.live/api/test';
  
  try {
    const response = await fetch(testUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://safetour.live',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log(`OPTIONS Status: ${response.status}`);
    console.log(`CORS Headers: ${JSON.stringify({
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    }, null, 2)}`);
  } catch (error) {
    console.log(`CORS Test Error: ${error.message}`);
  }
}

// Run tests
testDomainConnectivity();
testCORS();
