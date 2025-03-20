// components/NotificationMobileOverlay.js
import { useNotifications } from '../hooks/useNotifications';
import NotificationCard from './NotificationCard';
import styles from '../styles/notificationMobileOverlay.module.css';

const NotificationMobileOverlay = ({ onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    loading,

    markAllAsRead,
    clearAll
  } = useNotifications();
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      'event_created': '🎉',
      'event_joined': '👋',
      'event_reminder': '⏰',
      'event_updated': '📝',
      'event_canceled': '❌',
      'welcome': '👋',
      'system': '⚙️',
      'login_success': '🔑',
      'email_verification_sent': '✉️',
      'email_verification_reminder': '📧'
    };
    
    return icons[type] || '🔔';
  };
  
  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.header}>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close notifications"
          >
            ×
          </button>
          <h2>Notifications</h2>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>Loading...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close notifications"
        >
          ×
        </button>
        <h2>Notifications {unreadCount > 0 && `(${unreadCount})`}</h2>
      </div>
      
      <div className={styles.actions}>
        <button 
          className={styles.actionButton}
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </button>
        <button 
          className={styles.actionButton}
          onClick={clearAll}
          disabled={notifications.length === 0}
        >
          Clear all
        </button>
      </div>
      
      <div className={styles.notificationList}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationCard 
              key={notification.id}
              notification={notification}
              icon={getNotificationIcon(notification.type)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationMobileOverlay;