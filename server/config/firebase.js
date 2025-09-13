const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = async () => {
  try {
    // Check if required Firebase environment variables are present
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Firebase configuration incomplete. Missing environment variables:', missingVars);
      console.warn('⚠️ Running in mock mode. Please configure Firebase for production use.');
      return false;
    }

    if (admin.apps.length === 0) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
      
      // Test Firestore database connectivity
      const connected = await testDatabaseConnection();
      return connected;
    }
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.warn('⚠️ Running in mock mode due to Firebase initialization failure');
    return false;
  }
};

// Test database connectivity
const testDatabaseConnection = async () => {
  try {
    const db = admin.firestore();
    
    // Try to access Firestore settings to verify connection
    const testDoc = db.collection('_health_check').doc('test');
    await testDoc.set({ timestamp: admin.firestore.FieldValue.serverTimestamp(), status: 'connected' });
    await testDoc.delete(); // Clean up test document
    
    console.log('✅ Firestore database connected successfully');
    return true;
  } catch (error) {
    if (error.code === 5 || error.message.includes('NOT_FOUND')) {
      console.error('❌ Firestore database not found - Please enable Firestore in Firebase Console');
      console.error('   → Go to https://console.firebase.google.com');
      console.error('   → Select your project → Firestore Database → Create database');
    } else {
      console.error('❌ Firestore database connection failed:', error.message);
    }
    console.warn('⚠️ API will run in mock mode');
    return false;
  }
};

// Initialize Firebase
let firebaseInitialized = false;
initializeFirebase().then(success => {
  firebaseInitialized = success;
  if (success) {
    console.log('🔥 Firebase initialized and ready');
  } else {
    console.log('⚠️ Running in mock mode - Firebase not configured');
  }
}).catch(error => {
  console.error('❌ Failed to initialize Firebase:', error.message);
  console.log('⚠️ Continuing in mock mode...');
  firebaseInitialized = false;
});

// Export Firebase services (with null checks for mock mode)
let auth, db, storage, realtimeDb;

try {
  if (admin.apps.length > 0) {
    auth = admin.auth();
    db = admin.firestore();
    storage = admin.storage();
    realtimeDb = admin.database();
  } else {
    // Mock mode - services will be null
    auth = null;
    db = null;
    storage = null;
    realtimeDb = null;
  }
} catch (error) {
  console.warn('⚠️ Firebase services not available, using mock mode');
  auth = null;
  db = null;
  storage = null;
  realtimeDb = null;
}

module.exports = {
  admin: admin.apps.length > 0 ? admin : null,
  auth,
  db,
  storage,
  realtimeDb,
  isInitialized: () => firebaseInitialized
};
