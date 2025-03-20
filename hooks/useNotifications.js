import { useState, useEffect } from "react";
import { auth } from "../firebase/firebaseConfig";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../firebase/notificationAPI";

/**
 * Custom hook for handling notifications
 * @returns {Object} Notification methods and data
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);

    // Subscribe to notifications
    const unsubscribe = subscribeToNotifications(user.uid, (notificationData) => {
      console.log("New notifications fetched:", notificationData); // Debugging log
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter((n) => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      console.log(`Marking notification ${notificationId} as read`);
      await markNotificationAsRead(user.uid, notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      console.log("Marking all notifications as read");
      await markAllNotificationsAsRead(user.uid);

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      setError("Failed to mark all notifications as read");
    }
  };

  const removeNotification = async (notificationId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      console.log(`Deleting notification ${notificationId}`);
      await deleteNotification(user.uid, notificationId);

      const removedNotification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      if (removedNotification && !removedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      setError("Failed to delete notification");
    }
  };

  const clearAll = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      console.log("Clearing all notifications");
      await clearAllNotifications(user.uid);

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error clearing notifications:", err);
      setError("Failed to clear notifications");
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
};
