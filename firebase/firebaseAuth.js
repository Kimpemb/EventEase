// firebase/firebaseAuth.js
import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { sendNotification } from "./NotificationService"; // Import notification service

// Sign Up Function with Email Verification and Notification
export const signUp = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's profile with the username
    await updateProfile(user, { displayName: username });

    // Send email verification
    await sendEmailVerification(user);

    // Send welcome notification
    await sendNotification({
      userId: user.uid,
      type: "welcome",
      message: `Welcome to EventEase, ${username}! Verify your email to get started.`,
      channel: "email", // Default channel
    });

    return user;
  } catch (error) {
    throw error;
  }
};

// Sign In Function with Email Verification Check and Notification
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      await signOut(auth); // Sign out unverified users

      // Send reminder notification to verify email
      await sendNotification({
        userId: user.uid,
        type: "email_verification_reminder",
        message: "Please verify your email to access your account.",
        channel: "email",
      });

      throw new Error("Email not verified. Please check your inbox.");
    }

    // Send login success notification
    await sendNotification({
      userId: user.uid,
      type: "login_success",
      message: `Welcome back, ${user.displayName}!`,
      channel: "in-app", // Default to in-app notification
    });

    return user;
  } catch (error) {
    throw error;
  }
};

// Resend Verification Email with Notification
export const resendVerificationEmail = async () => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);

    // Send notification about email verification sent
    await sendNotification({
      userId: auth.currentUser.uid,
      type: "email_verification_sent",
      message: "Verification email sent. Please check your inbox.",
      channel: "email",
    });
  } else {
    throw new Error("No authenticated user found.");
  }
};