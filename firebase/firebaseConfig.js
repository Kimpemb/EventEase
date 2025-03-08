import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhJqp7xHIMHk7r6Ej_1PtWJLZPmzqokBE",
  authDomain: "eventease-1c3a0.firebaseapp.com",
  projectId: "eventease-1c3a0",
  storageBucket: "eventease-1c3a0.appspot.com",
  messagingSenderId: "772880524628",
  appId: "1:772880524628:web:ae5708332cc34646b154c1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Google Sign-In provider
const googleProvider = new GoogleAuthProvider();

// Google Sign-In function with error handling
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Signed in user:", result.user);
    return result.user; // Return the user object for further use
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error; // Re-throw the error for handling in the calling function
  }
};