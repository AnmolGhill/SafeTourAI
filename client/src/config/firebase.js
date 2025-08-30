// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC2Rz1lHAjof0PBEj6HebP6sp8jrpYKg88",
  authDomain: "safetourai.firebaseapp.com",
  projectId: "safetourai",
  storageBucket: "safetourai.firebasestorage.app",
  messagingSenderId: "25887736789",
  appId: "1:25887736789:web:07e88e5e030a08cffa335c",
  measurementId: "G-91E1XENH43"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

export { 
  app, 
  analytics, 
  auth, 
  db, 
  storage, 
  messaging 
};
