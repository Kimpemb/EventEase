// /firebase/notificationAPI.js
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

// Send a notification to a specific user
export const sendNotification = async (userId, notification) => {
  try {
    const notificationData = {
      type: notification.type,
      message: notification.message,
      timestamp: serverTimestamp(),
      read: false,
      channel: notification.channel || "in-app",
      ...(notification.eventId && { eventId: notification.eventId }),
    };

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

// Notify the event organizer
export const notifyOrganizer = async (organizerId, eventId, participantName, action) => {
  try {
    const message = `${participantName} has ${action} your event.`;
    await sendNotification(organizerId, {
      type: "participant_update",
      message,
      eventId
    });
  } catch (error) {
    console.error("Error notifying organizer:", error);
    throw error;
  }
};

// Save a donation notification
export const saveDonationNotification = async (userId, message, eventId = null) => {
  try {
    await sendNotification(userId, {
      type: "donation",
      message,
      eventId
    });
  } catch (error) {
    console.error("Failed to save donation notification:", error);
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, "users", userId, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    const unreadQuery = query(notificationsRef, where("read", "==", false));
    
    const querySnapshot = await getDocs(unreadQuery);
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (userId, notificationId) => {
  try {
    await deleteDoc(doc(db, "users", userId, "notifications", notificationId));
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

// Clear all notifications for a user
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

// Subscribe to real-time notifications
export const subscribeToNotifications = (userId, callback) => {
  if (!userId) return () => {};
  
  const notificationsRef = collection(db, "users", userId, "notifications");
  const q = query(notificationsRef, orderBy("timestamp", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));
    
    callback(notifications);
  }, (error) => {
    console.error("Error subscribing to notifications:", error);
  });
};
