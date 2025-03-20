// components/NotificationSettings.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from '../styles/notificationSettings.module.css';

const NotificationSettings = () => {
  // State for notification settings
  const [settings, setSettings] = useState({
    channels: {
      inApp: true,
      email: true,
      push: false,
    },
    types: {
      event_created: true,
      event_joined: true,
      event_reminder: true,
      event_updated: true,
      event_canceled: true,
      system: true,
    },
    frequency: 'realtime', // 'realtime', 'daily', 'weekly'
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load user's notification settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const settingsRef = doc(db, 'users', user.uid, 'settings', 'notifications');
        const settingsSnapshot = await getDoc(settingsRef);

        if (settingsSnapshot.exists()) {
          setSettings(settingsSnapshot.data());
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading notification settings:', err);
        setError('Failed to load settings');
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to Firestore
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const settingsRef = doc(db, 'users', user.uid, 'settings', 'notifications');
      await setDoc(settingsRef, settings, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Toggle notification channels
  const handleChannelToggle = (channel) => {
    setSettings({
      ...settings,
      channels: {
        ...settings.channels,
        [channel]: !settings.channels[channel],
      },
    });
  };

  // Toggle notification types
  const handleTypeToggle = (type) => {
    setSettings({
      ...settings,
      types: {
        ...settings.types,
        [type]: !settings.types[type],
      },
    });
  };

  // Change notification frequency
  const handleFrequencyChange = (frequency) => {
    setSettings({
      ...settings,
      frequency,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Notification Settings</h1>

      {/* Error and success messages */}
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>Settings saved successfully!</p>}

      {/* Notification Channels Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notification Channels</h2>
        <p className={styles.sectionDescription}>Choose how you want to receive notifications</p>

        <div className={styles.optionsList}>
          {Object.entries(settings.channels).map(([channel, isEnabled]) => (
            <div key={channel} className={styles.option}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => handleChannelToggle(channel)}
                  className={styles.checkbox}
                  disabled={channel === 'push'} // Disable push notifications for now
                />
                {channel === 'inApp' ? 'In-App Notifications' : channel === 'email' ? 'Email Notifications' : 'Push Notifications'}
              </label>
              <p className={styles.description}>
                {channel === 'inApp'
                  ? 'Receive notifications within the application'
                  : channel === 'email'
                  ? 'Receive notifications via email'
                  : 'Receive push notifications (Coming soon)'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Notification Types Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notification Types</h2>
        <p className={styles.sectionDescription}>Select which types of notifications you want to receive</p>

        <div className={styles.optionsList}>
          {Object.entries(settings.types).map(([type, isEnabled]) => (
            <div key={type} className={styles.option}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => handleTypeToggle(type)}
                  className={styles.checkbox}
                />
                {type === 'event_created'
                  ? 'Event Creation'
                  : type === 'event_joined'
                  ? 'Event Joined'
                  : type === 'event_reminder'
                  ? 'Event Reminders'
                  : type === 'event_updated'
                  ? 'Event Updates'
                  : type === 'event_canceled'
                  ? 'Event Cancelations'
                  : 'System Notifications'}
              </label>
              <p className={styles.description}>
                {type === 'event_created'
                  ? 'When you create a new event'
                  : type === 'event_joined'
                  ? 'When someone joins your event'
                  : type === 'event_reminder'
                  ? 'Reminders for upcoming events'
                  : type === 'event_updated'
                  ? 'When an event you\'re part of is updated'
                  : type === 'event_canceled'
                  ? 'When an event is canceled'
                  : 'Important updates from the platform'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Notification Frequency Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notification Frequency</h2>
        <p className={styles.sectionDescription}>How often you want to receive notifications</p>

        <div className={styles.optionsList}>
          {['realtime', 'daily', 'weekly'].map((frequency) => (
            <div key={frequency} className={styles.option}>
              <label className={styles.label}>
                <input
                  type="radio"
                  checked={settings.frequency === frequency}
                  onChange={() => handleFrequencyChange(frequency)}
                  className={styles.radio}
                />
                {frequency === 'realtime'
                  ? 'Real-time'
                  : frequency === 'daily'
                  ? 'Daily Digest'
                  : 'Weekly Digest'}
              </label>
              <p className={styles.description}>
                {frequency === 'realtime'
                  ? 'Receive notifications as they happen'
                  : frequency === 'daily'
                  ? 'Receive a summary of notifications once a day'
                  : 'Receive a summary of notifications once a week'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <button onClick={saveSettings} disabled={saving} className={styles.saveButton}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};

export default NotificationSettings;