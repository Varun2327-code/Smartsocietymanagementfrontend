import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

async function testAdminLogin() {
  const adminEmail = 'admin@smartsociety.com';
  const adminPassword = 'admin12';

  console.log('🔍 Testing admin login...');
  console.log('Email:', adminEmail);
  console.log('');

  try {
    // First, check if the email is registered in Firebase Auth
    console.log('📧 Checking if email is registered in Firebase Auth...');
    const signInMethods = await fetchSignInMethodsForEmail(auth, adminEmail);
    console.log('Sign-in methods for email:', signInMethods);

    if (signInMethods.length === 0) {
      console.log('❌ Email is not registered in Firebase Authentication');
      console.log('💡 You need to create the admin user first');
      return;
    }

    console.log('✅ Email is registered in Firebase Auth');

    // Try to sign in
    console.log('🔐 Attempting to sign in...');
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    console.log('✅ Successfully signed in!');
    console.log('User ID:', user.uid);
    console.log('Email:', user.email);

    // Check user role in Firestore
    console.log('🔍 Checking user role in Firestore...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User data:', userData);
      console.log('User role:', userData.role);

      if (userData.role === 'admin') {
        console.log('✅ User has admin role - login should work!');
      } else {
        console.log('⚠️ User does not have admin role');
      }
    } else {
      console.log('❌ User document not found in Firestore');
    }

  } catch (error) {
    console.error('❌ Error during login test:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 'auth/invalid-credential') {
      console.log('💡 This usually means the password is incorrect or the user doesn\'t exist');
    } else if (error.code === 'auth/user-not-found') {
      console.log('💡 The user does not exist in Firebase Authentication');
    } else if (error.code === 'auth/wrong-password') {
      console.log('💡 The password is incorrect');
    }
  }
}

testAdminLogin().catch(console.error);
