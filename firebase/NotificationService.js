// firebase/NotificationService.js
import { db } from "./firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Sends a notification to a user.
 * @param {string} userId - The ID of the user to send the notification to.
 * @param {string} type - The type of notification (e.g., "event_joined", "event_left").
 * @param {string} message - The notification message.
 * @param {string} channel - The channel to send the notification through (e.g., "email", "in-app").
 * @returns {Promise<void>}
 */
export const sendNotification = async ({ userId, type, message, channel }) => {
    try {
      // Add the notification to the user's notifications collection in Firestore
      await addDoc(collection(db, "users", userId, "notifications"), {
        type,
        message,
        channel,
        read: false, // Mark as unread by default
        timestamp: serverTimestamp(), // Add a timestamp
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  };