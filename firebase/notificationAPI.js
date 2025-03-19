// firebase/notificationAPI.js
import { db } from "./firebaseConfig";
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  getDocs
} from "firebase/firestore";

/**
 * Send a notification to a specific user
 * @param {string} userId - The recipient's user ID
 * @param {Object} notification - The notification object
 * @param {string} notification.type - Type of notification (event_created, event_joined, etc.)
 * @param {string} notification.message - The notification message
 * @param {string} [notification.eventId] - Optional related event ID
 * @param {string} [notification.channel="in-app"] - Delivery channel (in-app, email, sms)
 * @returns {Promise<string>} - The notification document ID
 */
export const sendNotification = async (userId, notification) => {
  try {
    // Default notification object structure
    const notificationData = {
      type: notification.type,
      message: notification.message,
      timestamp: serverTimestamp(),
      read: false,
      channel: notification.channel || "in-app",
      ...(notification.eventId && { eventId: notification.eventId }),
    };

    // Add notification to user's collection
    const docRef = await addDoc(
      collection(db, "users", userId, "notifications"),
      notificationData
    );

    return docRef.id;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} userId - The user ID
 * @param {string} notificationId - The notification document ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, "users", userId, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all user's notifications as read
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    const unreadQuery = query(notificationsRef, where("read", "==", false));
    
    const querySnapshot = await getDocs(unreadQuery);
    
    // Create array of promises for batch update
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );
    
    // Execute all updates
    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} userId - The user ID
 * @param {string} notificationId - The notification document ID
 * @returns {Promise<void>}
 */
export const deleteNotification = async (userId, notificationId) => {
  try {
    await deleteDoc(doc(db, "users", userId, "notifications", notificationId));
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

/**
 * Delete all notifications for a user
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const clearAllNotifications = async (userId) => {
  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    const querySnapshot = await getDocs(notificationsRef);
    
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error clearing all notifications:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time notification updates
 * @param {string} userId - The user ID
 * @param {function} callback - Callback function that receives notifications array
 * @returns {function} - Unsubscribe function
 */
export const subscribeToNotifications = (userId, callback) => {
  if (!userId) return () => {};
  
  const notificationsRef = collection(db, "users", userId, "notifications");
  const q = query(notificationsRef, orderBy("timestamp", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamp to JS Date if needed
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));
    
    callback(notifications);
  }, (error) => {
    console.error("Error subscribing to notifications:", error);
  });
};