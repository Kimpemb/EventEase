// components/NotificationCenter.jsx
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import styles from "../styles/NotificationCenter.module.css"; // Import your styles

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = auth.currentUser;

  // Fetch notifications from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notificationsList);

      // Calculate unread notifications
      const unread = notificationsList.filter((n) => !n.read).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", notificationId), {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle clearing all notifications
  const handleClearAll = async () => {
    try {
      const batch = notifications.map((n) =>
        updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true })
      );
      await Promise.all(batch);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return (
    <div className={styles.notificationCenter}>
      <h2>🔔 Notifications ({unreadCount} unread)</h2>
      <div className={styles.notificationList}>
        {notifications.map((notification) => (
          <div key={notification.id} className={styles.notification}>
            <p>{notification.message}</p>
            <small>
              {new Date(notification.timestamp?.toDate()).toLocaleString()}
            </small>
            {!notification.read && (
              <button
                onClick={() => handleMarkAsRead(notification.id)}
                className={styles.markRead}
              >
                Mark as Read
              </button>
            )}
          </div>
        ))}
        <button onClick={handleClearAll} className={styles.clearAll}>
          Clear All Notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationCenter;