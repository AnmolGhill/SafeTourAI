// Create Test User and Test Complete KYC Flow
const axios = require('axios');

const SERVER_URL = 'http://localhost:5000';

async function createTestUserAndFlow() {
  console.log('🔍 ========== VERIFY KYC TO QR FLOW ==========\n');
  
  try {
    // Test the actual flow using existing demo user
    console.log('📋 Step 1: Testing with demo user (demo-user-123)...');
    
    // Step 1: Test KYC submission for demo user
    const testKYCData = {
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

    console.log('📤 Submitting KYC for demo user...');
    try {
      const kycResponse = await axios.post(`${SERVER_URL}/api/kyc/submit`, testKYCData, {
        headers: {
          'Authorization': 'Bearer demo-token-123',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ KYC Submission:', kycResponse.status);
      console.log('📦 Response:', JSON.stringify(kycResponse.data, null, 2));
    } catch (kycError) {
      console.log('📡 KYC Submission Result:', kycError.response?.status);
      console.log('📄 Message:', kycError.response?.data?.message || kycError.response?.data?.error);
    }

    // Step 2: Test admin approval (this should generate blockchain ID)
    console.log('\n📋 Step 2: Testing admin KYC approval...');
    
    try {
      const approvalResponse = await axios.post(`${SERVER_URL}/api/admin/kyc/demo-user-123/approve`, {
        action: 'approve',
        comments: 'Test approval for digital ID generation'
      }, {
        headers: {
          'Authorization': 'Bearer demo-token-123',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ KYC Approval:', approvalResponse.status);
      console.log('📦 Response:', JSON.stringify(approvalResponse.data, null, 2));
      
      if (approvalResponse.data.blockchainId) {
        console.log('🎉 SUCCESS: Blockchain ID generated:', approvalResponse.data.blockchainId);
        
        // Step 3: Test QR generation
        await testQRGeneration(approvalResponse.data.blockchainId);
        
        // Step 4: Test police scanner
        await testPoliceScanner(approvalResponse.data.blockchainId);
        
        return { success: true, blockchainId: approvalResponse.data.blockchainId };
      } else {
        console.log('❌ ISSUE: No blockchain ID in approval response');
      }
      
    } catch (approvalError) {
      console.log('📡 Approval Error:', approvalError.response?.status);
      console.log('📄 Error:', approvalError.response?.data);
      
      // If approval fails, let's check current user status
      console.log('\n🔍 Checking current user status...');
      await checkUserStatus();
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testQRGeneration(blockchainId) {
  console.log('\n📋 Step 3: Testing QR generation...');
  
  try {
    const qrResponse = await axios.get(`${SERVER_URL}/api/blockchain/digital-id/qr`, {
      headers: {
        'Authorization': 'Bearer demo-token-123'
      }
    });
    
    console.log('✅ QR Generation:', qrResponse.status);
    console.log('📱 QR Data:', JSON.stringify(qrResponse.data, null, 2));
    
    if (qrResponse.data.qrData) {
      console.log('🎉 SUCCESS: QR code generated with blockchain ID');
    }
  } catch (qrError) {
    console.log('📡 QR Generation Error:', qrError.response?.status);
    console.log('📄 Error:', qrError.response?.data);
  }
}

async function testPoliceScanner(blockchainId) {
  console.log('\n📋 Step 4: Testing police scanner...');
  
  const qrData = {
    qrId: blockchainId,
    type: 'SafeTourDigitalID',
    version: '2.0'
  };
  
  console.log('📱 Testing QR:', JSON.stringify(qrData, null, 2));
  
  try {
    const scanResponse = await axios.post(`${SERVER_URL}/api/blockchain/verify-qr`, {
      qrData: qrData
    }, {
      headers: {
        'Authorization': 'Bearer demo-token-123',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Police Scanner:', scanResponse.status);
    console.log('📦 User Data:', JSON.stringify(scanResponse.data, null, 2));
    
    if (scanResponse.data.success && scanResponse.data.verified) {
      console.log('🎉 SUCCESS: Police can access user data!');
      console.log('👤 Retrieved Data:');
      console.log(`   - Name: ${scanResponse.data.userData?.fullName || 'N/A'}`);
      console.log(`   - Email: ${scanResponse.data.userData?.email || 'N/A'}`);
      console.log(`   - KYC Status: ${scanResponse.data.userData?.kycStatus || 'N/A'}`);
      console.log(`   - Government ID: ${scanResponse.data.userData?.governmentIdNumber || 'N/A'}`);
    }
    
  } catch (scanError) {
    console.log('📡 Scanner Error:', scanError.response?.status);
    console.log('📄 Error:', scanError.response?.data);
  }
}

async function checkUserStatus() {
  try {
    const statusResponse = await axios.get(`${SERVER_URL}/api/user/dashboard-stats`, {
      headers: {
        'Authorization': 'Bearer demo-token-123'
      }
    });
    
    console.log('✅ User Status:', statusResponse.status);
    console.log('📊 Stats:', JSON.stringify(statusResponse.data, null, 2));
    
  } catch (statusError) {
    console.log('📡 Status Check Error:', statusError.response?.status);
    console.log('📄 Error:', statusError.response?.data);
  }
}

// Run the test
createTestUserAndFlow()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Test completed successfully!');
      console.log('🔧 You can now test QR scanning with:');
      console.log('   QR ID:', result.blockchainId);
      console.log('   User ID:', result.testUserId);
    } else {
      console.log('\n❌ Test failed:', result.error);
    }
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
  });
