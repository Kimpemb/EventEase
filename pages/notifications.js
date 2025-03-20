// components/Notifications.js
import { useNotifications } from "../hooks/useNotifications";
import NotificationCard from "../components/NotificationCard";
import styles from "../styles/notifications.module.css";
import { Bell } from "lucide-react";

/**
 * Notifications component to display and manage user notifications
 */
const Notifications = () => {
  const { notifications, markAllAsRead, clearAll, loading, error } = useNotifications();

  if (loading) return <p>Loading notifications...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Notifications</h2>
        <div className={styles.actions}>
          <button onClick={markAllAsRead} className={styles.markAll}>
            Mark All as Read
          </button>
          <button onClick={clearAll} className={styles.clearAll}>
            Clear All
          </button>
        </div>
      </div>
      <div className={styles.notificationList}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              icon={<Bell size={20} />}
            />
          ))
        ) : (
          <p>No notifications to display.</p>
        )}
      </div>
    </div>
  );
};

export default Notifications;
