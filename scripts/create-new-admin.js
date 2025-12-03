import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

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

async function createNewAdminUser(email, password) {
  console.log('🚀 Creating new admin user...');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');

  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

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

    console.log('✅ New admin user created successfully!');
    console.log('User ID:', user.uid);
    console.log('');
    console.log('⚠️ IMPORTANT: Change this password immediately after first login!');

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin user with this email already exists');
      // Check if user actually exists in Firebase Auth
      const userList = await auth.listUsers(1000);
      const userExists = userList.users.some(u => u.email === email);
      if (!userExists) {
        console.log('⚠️ Warning: User email exists in Firestore but not in Firebase Auth');
      }
    } else {
      console.error('❌ Error creating new admin user:', error.message);
      console.error('Error code:', error.code);
    }
  }
}

// Example usage: change email and password as needed
const newAdminEmail = 'admin@smartsociety.com';
const newAdminPassword = 'admin12';

createNewAdminUser(newAdminEmail, newAdminPassword).catch(console.error);
