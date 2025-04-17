// firebase/firebaseAuth.js
import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { sendNotification } from "./NotificationService";

// Helper to get readable error messages
const getFriendlyError = (code) => {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address format.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password is too weak. It should be at least 6 characters.";
    default:
      return "An error occurred. Please try again.";
  }
};

// Sign Up Function with Email Verification and Notification
export const signUp = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: username });
    await sendEmailVerification(user);

    await sendNotification({
      userId: user.uid,
      type: "welcome",
      message: `Welcome to EventEase, ${username}! Verify your email to get started.`,
      channel: "email",
    });

    return user;
  } catch (error) {
    throw new Error(getFriendlyError(error.code));
  }
};

// Sign In Function with Email Verification Check and Notification
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      await signOut(auth);
      await sendNotification({
        userId: user.uid,
        type: "email_verification_reminder",
        message: "Please verify your email to access your account.",
        channel: "email",
      });

      throw new Error("Email not verified. Please check your inbox.");
    }

    await sendNotification({
      userId: user.uid,
      type: "login_success",
      message: `Welcome back, ${user.displayName || user.email}!`,
      channel: "in-app",
    });

    return user;
  } catch (error) {
    throw new Error(getFriendlyError(error.code));
  }
};

// Resend Verification Email with Notification
export const resendVerificationEmail = async () => {
  const currentUser = auth.currentUser;

  if (currentUser) {
    await sendEmailVerification(currentUser);

    await sendNotification({
      userId: currentUser.uid,
      type: "email_verification_sent",
      message: "Verification email sent. Please check your inbox.",
      channel: "email",
    });
  } else {
    throw new Error("No authenticated user found.");
  }
};
