// firebase/firebaseAuth.js
import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

// Sign Up Function with Email Verification
export const signUp = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's profile with the username
    await updateProfile(user, { displayName: username });

    // Send email verification
    await sendEmailVerification(user);

    return user;
  } catch (error) {
    throw error;
  }
};

// Sign In Function with Email Verification Check
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      await signOut(auth); // Sign out unverified users
      throw new Error("Email not verified. Please check your inbox.");
    }

    return user;
  } catch (error) {
    throw error;
  }
};

// Resend Verification Email
export const resendVerificationEmail = async () => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  } else {
    throw new Error("No authenticated user found.");
  }
};
