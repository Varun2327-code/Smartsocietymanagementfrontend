import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function createAlternativeAdmin() {
  // Use a different email to avoid conflicts
  const adminEmail = 'admin@smartsociety.dev';
  const adminPassword = 'Admin123!';

  console.log('🚀 Creating alternative admin user...');
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);
  console.log('');

  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    console.log('✅ User created in Firebase Auth!');
    console.log('User ID:', user.uid);

    // Create the user document in Firestore with admin role
    await setDoc(doc(db, 'users', user.uid), {
      email: adminEmail,
      name: 'System Administrator',
      role: 'admin',
      apartment: 'Admin Office',
      members: 1,
      iconColor: '#FF6B6B',
      createdAt: new Date()
    });

    console.log('✅ User document created in Firestore with admin role!');
    console.log('');
    console.log('🎉 Alternative admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('');
    console.log('⚠️ IMPORTANT: Change this password immediately after first login!');
    console.log('💡 You can now log in with these credentials from both regular login and admin login pages.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ This email is already in use. Please try a different email.');
    } else if (error.code === 'auth/weak-password') {
      console.log('💡 Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 Invalid email format.');
    }
  }
}

createAlternativeAdmin().catch(console.error);
