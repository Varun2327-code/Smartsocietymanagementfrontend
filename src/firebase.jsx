// firebase.js

// Import Firebase core and required services
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 🔄 For image uploads

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7JJgqRRRsIJffeFbHoKIMpJZcg2FVKAY",
  authDomain: "smart-society-b3836.firebaseapp.com",
  projectId: "smart-society-b3836",
  storageBucket: "smart-society-b3836.firebasestorage.app",
  messagingSenderId: "383518000680",
  appId: "1:383518000680:web:2dadc110fa8076770ad71d",
  measurementId: "G-R8B4Q4HMN9"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // 📂 Used for file uploads (e.g., profile photos)

// Export all services for use in your app
export { auth, db, storage };
export default app;
