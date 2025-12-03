import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminForce(email, password) {
  console.log('🚀 Force creating admin user...');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');

  try {
    // First check if user exists in Firebase Auth
    console.log('📧 Checking if user exists in Firebase Auth...');
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    console.log('Sign-in methods:', signInMethods);

    if (signInMethods.length > 0) {
      console.log('✅ User already exists in Firebase Auth');
      console.log('🔍 Checking user role in Firestore...');

      // Get user by email from Firestore (this is tricky without UID)
      // For now, let's assume we need to find the user document
      console.log('⚠️ User exists in Auth but we need to ensure Firestore role is set');
      console.log('💡 Please manually verify the user role in Firestore');
      return;
    }

    console.log('❌ User does not exist in Firebase Auth, creating...');

    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ User created in Firebase Auth!');
    console.log('User ID:', user.uid);

    // Create the user document in Firestore with admin role
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      name: 'System Administrator',
      role: 'admin',
      apartment: 'Admin Office',
      members: 1,
      iconColor: '#FF6B6B',
      createdAt: new Date()
    });

    console.log('✅ User document created in Firestore with admin role!');
    console.log('');
    console.log('🎉 Admin user setup complete!');
    console.log('⚠️ IMPORTANT: Change this password immediately after first login!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Email already in use. User might exist but role needs to be verified.');
    } else if (error.code === 'auth/weak-password') {
      console.log('💡 Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 Invalid email format.');
    }
  }
}

// Example usage
const adminEmail = 'admin@smartsociety.com';
const adminPassword = 'admin12';

createAdminForce(adminEmail, adminPassword).catch(console.error);
