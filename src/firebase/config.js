import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBB71D6BVo4MHXOU2HH5jRxTTSTF299XHY",
  authDomain: "patagonia-rnd-hub.firebaseapp.com",
  projectId: "patagonia-rnd-hub",
  storageBucket: "patagonia-rnd-hub.firebasestorage.app",
  messagingSenderId: "655359223000",
  appId: "1:655359223000:web:dc20c2d9a8993ca18c23ad"
};

// Initialize Firebase
let db = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.warn('⚠️ Firebase initialization failed:', error.message);
  db = null;
}

export { db };
