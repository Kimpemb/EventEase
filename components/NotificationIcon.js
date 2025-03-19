// components/NotificationIcon.js
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import styles from '../styles/notificationIcon.module.css';
import NotificationDropdown from './NotificationDropdown';

const NotificationIcon = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);
  
  return (
    <div className={styles.notificationContainer} ref={dropdownRef}>
      <button
        className={styles.notificationButton}
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <span className={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default NotificationIcon;