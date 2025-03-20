// components/NotificationMobileOverlay.js
import { useNotifications } from '../hooks/useNotifications';
import NotificationCard from './NotificationCard';
import styles from '../styles/notificationMobileOverlay.module.css';
import { useMemo } from 'react';

const NotificationMobileOverlay = ({ onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    loading,
    markAllAsRead,
    clearAllNotifications
  } = useNotifications();
  
  // Memoize the icons to avoid unnecessary re-renders
  const notificationIcons = useMemo(() => ({
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
  }), []);

  const getNotificationIcon = (type) => notificationIcons[type] || '🔔';

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
          aria-label="Mark all notifications as read"
        >
          Mark all as Read
        </button>
        <button 
          className={styles.actionButton}
          onClick={clearAllNotifications}
          disabled={notifications.length === 0}
          aria-label="Clear all notifications"
        >
          Clear All
        </button>
      </div>
      
      <div className={styles.notificationList}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No notifications yet. You're all caught up! 😊</p>
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
