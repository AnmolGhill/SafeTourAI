const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK with mock credentials for testing
if (!admin.apps.length) {
  try {
    // Use mock service account for testing
    const mockServiceAccount = {
      type: "service_account",
      project_id: "safetour-ai",
      private_key_id: "mock-key-id",
      private_key: "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk@safetour-ai.iam.gserviceaccount.com",
      client_id: "mock-client-id",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token"
    };

    admin.initializeApp({
      credential: admin.credential.cert(mockServiceAccount),
      databaseURL: "https://safetour-ai-default-rtdb.firebaseio.com/"
    });
    console.log('✅ Firebase initialized for testing');
  } catch (error) {
    console.log('⚠️ Firebase init failed, continuing with API tests only');
  }
}

const db = admin.firestore();
const BASE_URL = 'http://localhost:5000/api';

// Demo token for testing
const DEMO_TOKEN = 'demo-token-123';

async function testCompleteFlow() {
  console.log('🚀 ========== COMPLETE KYC TO QR FLOW TEST ==========\n');
  
  try {
    // Step 1: Test server health first
    console.log('📋 Step 1: Testing server connectivity...');
    try {
      const healthResponse = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('📡 Server Health:', healthResponse.status);
    } catch (error) {
      console.log('⚠️ Server may not be running. Starting API tests anyway...');
    }

    // Step 2: Test KYC submission endpoint directly
    console.log('\n📤 Step 2: Testing KYC submission API...');
    const testUserId = 'demo-user-123';
    
    // Test KYC submission
    const kycSubmitResponse = await fetch(`${BASE_URL}/kyc/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEMO_TOKEN}`,
        'x-user-id': testUserId
      },
      body: JSON.stringify({
        fullName: 'Demo Test User',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        governmentIdType: 'passport',
        governmentIdNumber: 'DEMO123456',
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'Demo State',
          country: 'Demo Country',
          pincode: '12345'
        }
      })
    });
    
    console.log('📡 KYC Submit Response:', kycSubmitResponse.status);
    if (kycSubmitResponse.ok) {
      const kycResult = await kycSubmitResponse.json();
      console.log('📄 KYC Submit Result:', kycResult);
    }
    
    // Step 2: Submit KYC for the test user
    console.log('\n📤 Step 2: Submitting KYC for test user...');
    const kycData = {
      uid: testUserId,
      fullName: 'Test User Full Name',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      governmentIdType: 'passport',
      governmentIdNumber: 'TEST123456',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        pincode: '12345'
      },
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'submitted'
    };
    
    await db.collection('kyc').doc(testUserId).set(kycData);
    console.log('✅ KYC data submitted for user');
    
    // Step 3: Admin approves KYC (this should generate blockchain ID)
    console.log('\n👨‍💼 Step 3: Admin approving KYC...');
    const approvalResponse = await fetch(`${BASE_URL}/admin/kyc/${testUserId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEMO_TOKEN}`
      },
      body: JSON.stringify({
        action: 'approve'
      })
    });
    
    const approvalResult = await approvalResponse.json();
    console.log('📡 Admin Approval Response:', approvalResponse.status);
    console.log('📄 Approval Result:', approvalResult);
    
    if (approvalResult.success && approvalResult.blockchainId) {
      console.log('✅ Blockchain ID generated:', approvalResult.blockchainId);
    }
    
    // Step 4: Check if user can generate QR code
    console.log('\n🔗 Step 4: Testing QR code generation...');
    const qrResponse = await fetch(`${BASE_URL}/blockchain/digital-id/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEMO_TOKEN}`,
        'x-user-id': testUserId
      }
    });
    
    const qrResult = await qrResponse.json();
    console.log('📡 QR Generation Response:', qrResponse.status);
    console.log('📄 QR Data:', qrResult);
    
    // Step 5: Test police scanner access
    if (qrResult.success && qrResult.qrData) {
      console.log('\n👮 Step 5: Testing police scanner access...');
      const scanResponse = await fetch(`${BASE_URL}/blockchain/verify-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEMO_TOKEN}`
        },
        body: JSON.stringify({
          qrData: qrResult.qrData
        })
      });
      
      const scanResult = await scanResponse.json();
      console.log('📡 Police Scanner Response:', scanResponse.status);
      console.log('📄 Scanner Result:', scanResult);
      
      if (scanResult.success) {
        console.log('✅ Police scanner successfully retrieved user data');
        console.log('👤 User Info:', {
          name: scanResult.userData?.fullName,
          id: scanResult.userData?.governmentIdType,
          verified: scanResult.userData?.kycStatus
        });
      }
    }
    
    // Step 6: Verify data in Firebase
    console.log('\n🔍 Step 6: Verifying data in Firebase...');
    const userDoc = await db.collection('users').doc(testUserId).get();
    const kycDoc = await db.collection('kyc').doc(testUserId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ User document exists');
      console.log('📊 User data:', {
        kycStatus: userData.kycStatus,
        blockchainId: userData.blockchainId,
        role: userData.role
      });
    }
    
    if (kycDoc.exists) {
      const kycData = kycDoc.data();
      console.log('✅ KYC document exists');
      console.log('📊 KYC data:', {
        status: kycData.status,
        fullName: kycData.fullName,
        reviewedAt: kycData.reviewedAt
      });
    }
    
    console.log('\n🎉 ========== FLOW TEST COMPLETED ==========');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await db.collection('users').doc(testUserId).delete();
    await db.collection('kyc').doc(testUserId).delete();
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Flow test error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testCompleteFlow().then(() => {
  console.log('\n✅ Complete flow test finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
