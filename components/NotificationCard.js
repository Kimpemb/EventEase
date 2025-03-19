// components/NotificationCard.js
import { useRouter } from 'next/router';
import { useNotifications } from '../hooks/useNotifications';
import styles from '../styles/notificationCard.module.css';

const NotificationCard = ({ notification, icon }) => {
  const router = useRouter();
  const { markAsRead, removeNotification } = useNotifications();
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Handle notification click
  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to related content if applicable
    if (notification.eventId) {
      router.push(`/events/${notification.eventId}`);
    }
  };
  
  // Handle removing a notification
  const handleRemove = async (e) => {
    e.stopPropagation();
    await removeNotification(notification.id);
  };
  
  // Handle marking as read
  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    await markAsRead(notification.id);
  };
  
  return (
    <div 
      className={`${styles.card} ${!notification.read ? styles.unread : ''}`}
      onClick={handleClick}
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <p className={styles.message}>{notification.message}</p>
        <p className={styles.timestamp}>{formatTime(notification.timestamp)}</p>
      </div>
      <div className={styles.actions}>
        {!notification.read && (
          <button 
            className={styles.markRead}
            onClick={handleMarkAsRead}
            aria-label="Mark as read"
          >
            ✓
          </button>
        )}
        <button 
          className={styles.delete}
          onClick={handleRemove}
          aria-label="Delete notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default NotificationCard;