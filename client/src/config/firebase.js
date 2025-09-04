// Firebase client configuration for sign-in tracking
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummy",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "safetourai-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "safetourai-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "safetourai-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:dummy"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

console.log('🔥 Firebase client initialized for authentication tracking');

export default app;
