// hooks/useNotifications.js
import { useState, useEffect } from "react";
import { auth } from "../firebase/firebaseConfig";
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
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
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.read).length);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  /**
   * Mark a single notification as read
   * @param {string} notificationId - The notification ID
   */
  const markAsRead = async (notificationId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      await markNotificationAsRead(user.uid, notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError("Failed to mark notification as read");
      console.error(err);
    }
  };
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      await markAllNotificationsAsRead(user.uid);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError("Failed to mark all notifications as read");
      console.error(err);
    }
  };
  
  /**
   * Delete a notification
   * @param {string} notificationId - The notification ID
   */
  const removeNotification = async (notificationId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      await deleteNotification(user.uid, notificationId);
      
      // Update local state
      const removedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if needed
      if (removedNotification && !removedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError("Failed to delete notification");
      console.error(err);
    }
  };
  
  /**
   * Clear all notifications
   */
  const clearAll = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      await clearAllNotifications(user.uid);
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setError("Failed to clear notifications");
      console.error(err);
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
    clearAll
  };
};