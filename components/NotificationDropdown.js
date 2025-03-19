// components/NotificationDropdown.js
import Link from 'next/link';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCard from './NotificationCard';
import styles from '../styles/notificationDropdown.module.css';

const NotificationDropdown = ({ onClose }) => {
  const { 
    notifications, 
    unreadCount,
    loading, 
    markAllAsRead,
    clearAll
  } = useNotifications();
  
  // Show only most recent 5 notifications in dropdown
  const recentNotifications = notifications.slice(0, 5);
  
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
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };
  
  if (loading) {
    return (
      <div className={styles.dropdown}>
        <div className={styles.header}>
          <h3>Notifications</h3>
        </div>
        <div className={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }
  
  return (
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <h3>Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
        <button 
          className={styles.actionButton}
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </button>
      </div>
      
      <div className={styles.notificationList}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No notifications</p>
          </div>
        ) : (
          recentNotifications.map(notification => (
            <NotificationCard 
              key={notification.id}
              notification={notification}
              icon={getNotificationIcon(notification.type)}
            />
          ))
        )}
      </div>
      
      <div className={styles.footer}>
        <Link href="/notifications">
          <a className={styles.viewAllLink} onClick={onClose}>View all</a>
        </Link>
        {notifications.length > 0 && (
          <button className={styles.clearButton} onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;