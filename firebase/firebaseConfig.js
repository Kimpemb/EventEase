import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Add GoogleAuthProvider and signInWithPopup

const firebaseConfig = {
    apiKey: "AIzaSyDhJqp7xHIMHk7r6Ej_1PtWJLZPmzqokBE",
    authDomain: "eventease-1c3a0.firebaseapp.com",
    projectId: "eventease-1c3a0",
    storageBucket: "eventease-1c3a0.appspot.com",
    messagingSenderId: "772880524628",
    appId: "1:772880524628:web:ae5708332cc34646b154c1",
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Add Google Sign-In functionality
const provider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, provider);