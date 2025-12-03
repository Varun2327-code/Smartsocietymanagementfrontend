// Script to create user profile for existing authenticated user
// Run with: node scripts/create-user-profile.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Firebase configuration (same as in firebase.jsx)
const firebaseConfig = {
  apiKey: "AIzaSyA7JJgqRRRsIJffeFbHoKIMpJZcg2FVKAY",
  authDomain: "smart-society-b3836.firebaseapp.com",
  projectId: "smart-society-b3836",
  storageBucket: "smart-society-b3836.firebasestorage.app",
  messagingSenderId: "383518000680",
  appId: "1:383518000680:web:2dadc110fa8076770ad71d",
  measurementId: "G-R8B4Q4HMN9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createUserProfile() {
  // User details from the error logs
  const userId = 'KRGbmJjTR5QQZKbniBQAedkYn5M2';
  const userEmail = 'varun@gmail.com';
  const userName = 'Varun'; // You can change this to the actual name

  console.log('🚀 Creating user profile for existing user...');
  console.log('User ID:', userId);
  console.log('Email:', userEmail);
  console.log('');

  try {
    // Check if user profile already exists
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      console.log('ℹ️ User profile already exists');
      console.log('User data:', userDocSnap.data());
      return;
    }

    // Create the user document in Firestore
    await setDoc(userDocRef, {
      uid: userId,
      name: userName,
      email: userEmail,
      role: 'resident',
      apartment: 'A-101', // Default apartment, can be updated later
      wing: 'A', // Default wing, can be updated later
      mobile: '9876543210', // Default mobile, can be updated later
      members: 1,
      status: 'active',
      lastPayment: 0,
      complaintsResolved: 0,
      bio: '',
      emergencyContact: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ User profile created successfully!');
    console.log('User ID:', userId);
    console.log('Name:', userName);
    console.log('Email:', userEmail);
    console.log('');
    console.log('⚠️ IMPORTANT:');
    console.log('1. Update the user profile with correct details (apartment, mobile, etc.)');
    console.log('2. The user can now log in and see their profile in the RightSidebar');

  } catch (error) {
    console.error('❌ Error creating user profile:', error.message);
    console.error('Error code:', error.code);
  }
}

// Run the function
createUserProfile().catch(console.error);
