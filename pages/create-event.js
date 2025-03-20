import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic"; // Import dynamic from Next.js
import { auth } from "../firebase/firebaseConfig";
import { createEvent, sendNotification } from "../firebase/firebaseEvents";
import styles from "../styles/createEvent.module.css";

// Dynamically import LocationPicker to avoid SSR issues
const LocationPicker = dynamic(() => import("../components/LocationPicker"), {
  ssr: false, // Disable server-side rendering
});

const CreateEventPage = () => {
  // State for form data
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: null, // Initialize location as null
    category: "General",
  });

  // UI states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth state
  const [user, setUser] = useState(null);

  const router = useRouter();

  // Check authentication status on component mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        // Redirect if not logged in
        router.push("/login?redirect=create-event");
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [router]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle location selection from LocationPicker
  const handleLocationSelect = (location) => {
    setEventData((prev) => ({
      ...prev,
      location, // location is an object: { address, lat, lng }
    }));
  };

  // Validate event times
  const validateEventTimes = () => {
    const eventStart = new Date(`${eventData.date}T${eventData.startTime}`);
    const eventEnd = new Date(`${eventData.date}T${eventData.endTime}`);
    const now = new Date();

    if (eventStart <= now) {
      setError("Event start time must be in the future.");
      return false;
    }

    if (eventEnd <= eventStart) {
      setError("End time must be after the start time.");
      return false;
    }

    return true;
  };

  // Validate form data
  const validateForm = () => {
    if (!eventData.title.trim()) {
      setError("Event title is required");
      return false;
    }

    if (!eventData.description.trim()) {
      setError("Event description is required");
      return false;
    }

    if (!eventData.date) {
      setError("Event date is required");
      return false;
    }

    if (!eventData.startTime || !eventData.endTime) {
      setError("Event start and end times are required");
      return false;
    }

    if (!validateEventTimes()) {
      return false;
    }

    if (!eventData.location) {
      setError("Please select an event location");
      return false;
    }

    return true;
  };

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Check if user is logged in
    if (!user) {
      setError("You must be logged in to create an event.");
      setLoading(false);
      return;
    }

    // Validate form data
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Create the event in Firebase
      const eventId = await createEvent({
        ...eventData,
        userId: user.uid,
        organizer: user.displayName || user.email || "Unknown Organizer",
        attendees: [user.uid], // Add creator as first attendee
      });

      // Send confirmation notification to the organizer
      await sendNotification(user.uid, {
        type: "event_created",
        message: `Your event "${eventData.title}" has been successfully created!`,
        timestamp: new Date(),
        read: false,
        eventId,
      });

      setSuccess("Event created successfully!");

      // Reset form fields
      setEventData({
        title: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        location: null,
        category: "General",
      });

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Error creating event:", err);
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    router.push("/dashboard");
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formPanel}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Create Event</h1>
          <button
            onClick={handleCancel}
            className={styles.cancelButton}
            type="button"
          >
            Cancel
          </button>
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}
        {success && <p className={styles.successMessage}>{success}</p>}

        <form onSubmit={handleSubmit} className={styles.eventForm}>
          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Event Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter event title"
              value={eventData.title}
              onChange={handleChange}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Event Description</label>
            <textarea
              name="description"
              placeholder="Describe your event"
              value={eventData.description}
              onChange={handleChange}
              className={styles.textArea}
              rows="4"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Date</label>
              <input
                type="date"
                name="date"
                value={eventData.date}
                onChange={handleChange}
                className={styles.dateInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Start Time</label>
              <input
                type="time"
                name="startTime"
                value={eventData.startTime}
                onChange={handleChange}
                className={styles.timeInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>End Time</label>
              <input
                type="time"
                name="endTime"
                value={eventData.endTime}
                onChange={handleChange}
                className={styles.timeInput}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Event Location</label>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={eventData.location}
            />
            {!eventData.location && (
              <p className={styles.helperText}>
                Please select a location for your event
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Category</label>
            <select
              name="category"
              value={eventData.category}
              onChange={handleChange}
              className={styles.selectInput}
            >
              <option value="General">General</option>
              <option value="Music">Music</option>
              <option value="Sports">Sports</option>
              <option value="Tech">Tech</option>
              <option value="Education">Education</option>
              <option value="Health">Health</option>
              <option value="Business">Business</option>
              <option value="Art">Art</option>
              <option value="Entertainment">Entertainment</option>
            </select>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Creating Event..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;