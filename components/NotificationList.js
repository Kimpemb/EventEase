// components/NotificationList.js
import { useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCard from './NotificationCard';
import styles from '../styles/notificationList.module.css';

const NotificationList = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    markAllAsRead,
    clearAll
  } = useNotifications();
  
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  
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
  
  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true; // 'all'
  });
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Loading notifications...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <Link href="/dashboard">
          <a className={styles.backLink}>Back to Dashboard</a>
        </Link>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
        
        <div className={styles.actions}>
          <div className={styles.filters}>
            <button 
              className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`${styles.filterButton} ${filter === 'unread' ? styles.active : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button 
              className={`${styles.filterButton} ${filter === 'read' ? styles.active : ''}`}
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
          
          <div className={styles.headerButtons}>
            <button 
              className={styles.markAllButton}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
            <button 
              className={styles.clearAllButton}
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.list}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No {filter !== 'all' ? filter : ''} notifications</p>
            {filter !== 'all' && (
              <button 
                className={styles.resetFilterButton}
                onClick={() => setFilter('all')}
              >
                Show all notifications
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationCard 
              key={notification.id}
              notification={notification}
              icon={getNotificationIcon(notification.type)}
            />
          ))
        )}
      </div>
      
      <div className={styles.footer}>
        <Link href="/dashboard">
          <a className={styles.backLink}>Back to Dashboard</a>
        </Link>
      </div>
    </div>
  );
};

export default NotificationList;