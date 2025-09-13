// Test Complete KYC to QR Flow - Verify Admin Approval → Digital ID → Police Access
const axios = require('axios');

const SERVER_URL = 'http://localhost:5000';

async function testCompleteKYCFlow() {
  console.log('🔍 ========== COMPLETE KYC TO QR FLOW TEST ==========\n');

  try {
    // Step 1: Test KYC submission
    console.log('📋 Step 1: Testing KYC submission...');
    
    const mockKYCData = {
      fullName: 'John Doe Test',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      nationality: 'Indian',
      governmentIdType: 'Passport',
      governmentIdNumber: 'P12345678',
      address: {
        street: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001'
      },
      phoneNumber: '+91-9876543210',
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phoneNumber: '+91-9876543211'
      }
    };

    // Mock user ID for testing
    const testUserId = 'test-user-' + Date.now();
    console.log(`👤 Test User ID: ${testUserId}`);

    // Test KYC submission endpoint
    try {
      const kycResponse = await axios.post(`${SERVER_URL}/api/kyc/submit`, mockKYCData, {
        headers: {
          'Authorization': 'Bearer demo-token-123',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ KYC Submission Response:', kycResponse.status);
      console.log('📦 KYC Data:', JSON.stringify(kycResponse.data, null, 2));
    } catch (kycError) {
      console.log('📡 KYC Submission Error:', kycError.response?.status);
      console.log('📄 Error:', kycError.response?.data);
    }

    // Step 2: Test admin KYC approval
    console.log('\n📋 Step 2: Testing admin KYC approval...');
    
    try {
      const approvalResponse = await axios.post(`${SERVER_URL}/api/admin/kyc/${testUserId}/approve`, {
        action: 'approve',
        comments: 'Test approval for digital ID generation'
      }, {
        headers: {
          'Authorization': 'Bearer demo-token-123',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ KYC Approval Response:', approvalResponse.status);
      console.log('📦 Approval Data:', JSON.stringify(approvalResponse.data, null, 2));
      
      if (approvalResponse.data.blockchainId) {
        console.log('🎉 SUCCESS: Blockchain ID generated:', approvalResponse.data.blockchainId);
        
        // Step 3: Test QR code generation
        console.log('\n📋 Step 3: Testing QR code generation...');
        await testQRGeneration(testUserId, approvalResponse.data.blockchainId);
        
        // Step 4: Test police scanner access
        console.log('\n📋 Step 4: Testing police scanner access...');
        await testPoliceAccess(approvalResponse.data.blockchainId);
        
      } else {
        console.log('❌ FAILED: No blockchain ID generated in approval response');
      }
      
    } catch (approvalError) {
      console.log('📡 KYC Approval Error:', approvalError.response?.status);
      console.log('📄 Error:', approvalError.response?.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testQRGeneration(userId, blockchainId) {
  try {
    const qrResponse = await axios.get(`${SERVER_URL}/api/blockchain/digital-id/qr`, {
      headers: {
        'Authorization': 'Bearer demo-token-123'
      }
    });
    console.log('✅ QR Generation Response:', qrResponse.status);
    console.log('📱 QR Data:', JSON.stringify(qrResponse.data, null, 2));
    
    if (qrResponse.data.qrData) {
      console.log('🎉 SUCCESS: QR code data generated');
      return qrResponse.data.qrData;
    }
  } catch (qrError) {
    console.log('📡 QR Generation Error:', qrError.response?.status);
    console.log('📄 Error:', qrError.response?.data);
  }
}

async function testPoliceAccess(blockchainId) {
  // Test with different QR formats
  const qrFormats = [
    {
      name: 'Simplified Format',
      qrData: {
        qrId: blockchainId,
        type: 'SafeTourDigitalID',
        version: '2.0'
      }
    },
    {
      name: 'Legacy Format',
      qrData: {
        type: 'SafeTourDigitalID',
        blockchainId: blockchainId,
        uid: 'demo-user-123',
        verificationLevel: 'Level 3 - Full KYC',
        network: 'SafeTour Blockchain',
        timestamp: new Date().toISOString(),
        hash: 'test-hash-123',
        issuer: 'SafeTourAI',
        version: '2.0'
      }
    }
  ];

  for (const format of qrFormats) {
    console.log(`\n🧪 Testing ${format.name}:`);
    console.log('📱 QR Data:', JSON.stringify(format.qrData, null, 2));
    
    try {
      const scanResponse = await axios.post(`${SERVER_URL}/api/blockchain/verify-qr`, {
        qrData: format.qrData
      }, {
        headers: {
          'Authorization': 'Bearer demo-token-123',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Police Scanner Response:', scanResponse.status);
      console.log('📦 User Data Retrieved:', JSON.stringify(scanResponse.data, null, 2));
      
      if (scanResponse.data.success && scanResponse.data.verified) {
        console.log('🎉 SUCCESS: Police can access user data!');
        console.log('👤 User Info:');
        console.log(`   - Name: ${scanResponse.data.userData?.fullName || 'N/A'}`);
        console.log(`   - Email: ${scanResponse.data.userData?.email || 'N/A'}`);
        console.log(`   - KYC Status: ${scanResponse.data.userData?.kycStatus || 'N/A'}`);
      }
      
    } catch (scanError) {
      console.log('📡 Police Scanner Error:', scanError.response?.status);
      console.log('📄 Error:', scanError.response?.data);
    }
  }
}

// Test Firebase database structure
async function testDatabaseStructure() {
  console.log('\n📋 Testing Database Structure...');
  
  // Test if we can access user data directly
  try {
    const userResponse = await axios.get(`${SERVER_URL}/api/user/profile`, {
      headers: {
        'Authorization': 'Bearer demo-token-123'
      }
    });
    console.log('✅ User Profile Access:', userResponse.status);
    console.log('📦 Profile Data:', JSON.stringify(userResponse.data, null, 2));
  } catch (userError) {
    console.log('📡 User Profile Error:', userError.response?.status);
    console.log('📄 Error:', userError.response?.data);
  }
  
  // Test KYC status endpoint
  try {
    const kycStatusResponse = await axios.get(`${SERVER_URL}/api/kyc/status`, {
      headers: {
        'Authorization': 'Bearer demo-token-123'
      }
    });
    console.log('✅ KYC Status Access:', kycStatusResponse.status);
    console.log('📦 KYC Status:', JSON.stringify(kycStatusResponse.data, null, 2));
  } catch (kycStatusError) {
    console.log('📡 KYC Status Error:', kycStatusError.response?.status);
    console.log('📄 Error:', kycStatusError.response?.data);
  }
}

// Run complete test
console.log('🚀 Starting Complete KYC to QR Flow Test...\n');

testDatabaseStructure()
  .then(() => testCompleteKYCFlow())
  .then(() => {
    console.log('\n✅ Complete KYC to QR flow test completed');
    console.log('\n🔧 SUMMARY:');
    console.log('1. KYC Submission → Check if working');
    console.log('2. Admin Approval → Check if blockchain ID generated');
    console.log('3. Digital ID Storage → Check if stored in Firebase');
    console.log('4. Police Access → Check if QR scanning retrieves data');
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
  });
