// Test QR Scanner API - Verify Police Scanner Works with QR Data Fetching
const axios = require('axios');

const SERVER_URL = 'http://localhost:5000';

async function testQRScannerAPI() {
  console.log('🔍 ========== QR SCANNER API TEST ==========\n');

  try {
    // Test 1: Test QR verification endpoint with simplified QR data
    console.log('📋 Test 1: Testing QR verification with simplified format...');
    
    const testQRData = {
      qrId: "ST-TEST123456",
      type: "SafeTourDigitalID",
      version: "2.0"
    };

    console.log('📱 Test QR Data:', JSON.stringify(testQRData, null, 2));

    // Mock authentication token (since auth middleware allows demo mode)
    const authToken = 'demo-token-123';

    try {
      const response = await axios.post(`${SERVER_URL}/api/blockchain/verify-qr`, {
        qrData: testQRData
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ QR Verification Response:');
      console.log('📊 Status:', response.status);
      console.log('📦 Data:', JSON.stringify(response.data, null, 2));

      if (response.data.success && response.data.verified) {
        console.log('\n🎉 SUCCESS: QR Scanner is working!');
        console.log('👤 User Data Retrieved:');
        console.log(`   - Name: ${response.data.userData?.fullName || 'N/A'}`);
        console.log(`   - Email: ${response.data.userData?.email || 'N/A'}`);
        console.log(`   - KYC Status: ${response.data.userData?.kycStatus || 'N/A'}`);
        console.log(`   - Government ID: ${response.data.userData?.governmentIdNumber || 'N/A'}`);
      } else {
        console.log('⚠️ QR verification returned false or failed');
      }

    } catch (apiError) {
      console.log('📡 API Response Error:', apiError.response?.status, apiError.response?.statusText);
      console.log('📄 Error Data:', apiError.response?.data);
    }

    // Test 2: Test with legacy QR format
    console.log('\n📋 Test 2: Testing with legacy QR format...');
    
    const legacyQRData = {
      type: 'SafeTourDigitalID',
      blockchainId: 'ST-TEST123456',
      uid: 'demo-user-123',
      verificationLevel: 'Level 3 - Full KYC',
      network: 'SafeTour Blockchain',
      timestamp: '2024-01-01T00:00:00.000Z',
      hash: 'a1b2c3d4e5f6',
      issuer: 'SafeTourAI',
      version: '2.0'
    };

    try {
      const response2 = await axios.post(`${SERVER_URL}/api/blockchain/verify-qr`, {
        qrData: legacyQRData
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Legacy QR Verification Response:');
      console.log('📊 Status:', response2.status);
      console.log('📦 Success:', response2.data.success);
      
      if (response2.data.success) {
        console.log('🎉 Legacy format also works!');
      }

    } catch (legacyError) {
      console.log('📡 Legacy API Error:', legacyError.response?.status);
      console.log('📄 Error:', legacyError.response?.data?.error);
    }

    // Test 3: Test server health
    console.log('\n📋 Test 3: Testing server health...');
    
    try {
      const healthResponse = await axios.get(`${SERVER_URL}/api/health`);
      console.log('✅ Server Health:', healthResponse.data);
    } catch (healthError) {
      console.log('⚠️ Health check failed, but server might still work');
    }

    // Test 4: Test authentication
    console.log('\n📋 Test 4: Testing authentication...');
    
    try {
      const noAuthResponse = await axios.post(`${SERVER_URL}/api/blockchain/verify-qr`, {
        qrData: testQRData
      });
      console.log('⚠️ No auth request succeeded (demo mode active)');
    } catch (noAuthError) {
      if (noAuthError.response?.status === 401) {
        console.log('✅ Authentication properly required');
      } else {
        console.log('📡 Unexpected auth error:', noAuthError.response?.status);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test QR data formats
function testQRDataFormats() {
  console.log('\n📋 QR DATA FORMAT EXAMPLES:\n');
  
  console.log('✅ Simplified Format (Recommended):');
  console.log(JSON.stringify({
    qrId: "ST-ABC12345",
    type: "SafeTourDigitalID",
    version: "2.0"
  }, null, 2));
  
  console.log('\n✅ Legacy Format (Still Supported):');
  console.log(JSON.stringify({
    type: 'SafeTourDigitalID',
    blockchainId: 'ST-ABC12345',
    uid: 'user123',
    verificationLevel: 'Level 3 - Full KYC',
    network: 'SafeTour Blockchain',
    timestamp: '2024-01-01T00:00:00.000Z',
    hash: 'a1b2c3d4',
    issuer: 'SafeTourAI',
    version: '2.0'
  }, null, 2));
}

// Run tests
console.log('🚀 Starting QR Scanner API Tests...\n');

testQRDataFormats();

testQRScannerAPI()
  .then(() => {
    console.log('\n✅ QR Scanner API test completed');
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
  });
