const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      // Validate Firebase configuration
      const requiredFields = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY_ID', 
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_CLIENT_ID',
        'FIREBASE_CLIENT_CERT_URL',
        'FIREBASE_DATABASE_URL'
      ];

      const missingFields = requiredFields.filter(field => 
        !process.env[field] || 
        process.env[field].includes('your_') || 
        process.env[field].includes('xxxxx')
      );

      if (missingFields.length > 0) {
        console.warn('Firebase configuration incomplete. Missing or invalid fields:', missingFields);
        console.warn('Firebase features will be disabled. Please configure Firebase environment variables for full functionality.');
        return;
      }

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
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });

      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error.message);
    console.warn('Firebase features will be disabled due to configuration error.');
  }
};

// Send push notification
const sendPushNotification = async (token, title, body, data = {}) => {
  try {
    if (admin.apps.length === 0) {
      console.warn('Firebase not initialized. Cannot send push notification.');
      return null;
    }

    const message = {
      notification: {
        title,
        body
      },
      data,
      token
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

// Send notification to multiple tokens
const sendMulticastNotification = async (tokens, title, body, data = {}) => {
  try {
    if (admin.apps.length === 0) {
      console.warn('Firebase not initialized. Cannot send multicast notification.');
      return null;
    }

    const message = {
      notification: {
        title,
        body
      },
      data,
      tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Multicast notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    throw error;
  }
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    if (admin.apps.length === 0) {
      console.warn('Firebase not initialized. Cannot verify ID token.');
      throw new Error('Firebase not configured');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendMulticastNotification,
  verifyIdToken,
  admin
};
