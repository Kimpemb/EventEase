import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig"; // Added `auth` import
import styles from "../../styles/createEvent.module.css"; // Use the same CSS as create-event

const EditEventPage = () => {
  const router = useRouter();
  const { id } = router.query; // Extract the event ID from the URL
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("General");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch event data when the component mounts
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return; // Ensure id is defined
      console.log("Fetching Event - Event ID:", id); // Log the event ID
      const eventRef = doc(db, "events", id);
      try {
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          console.log("Event Data Fetched:", eventData); // Log the fetched data
          setTitle(eventData.title);
          setDescription(eventData.description);
          setDate(eventData.date);
          setStartTime(eventData.startTime);
          setEndTime(eventData.endTime);
          setLocation(eventData.location);
          setCategory(eventData.category);
        } else {
          console.error("Event not found - Event ID:", id); // Log if event is not found
          setError("Event not found!");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching event:", error); // Log any errors
        setError("Failed to load event. Please try again.");
      }
    };
    fetchEvent();
  }, [id, router]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const user = auth.currentUser; // Now `auth` is defined
    if (!user) {
      setError("You must be logged in to edit an event.");
      setLoading(false);
      return;
    }

    const eventStart = new Date(`${date}T${startTime}`);
    const eventEnd = new Date(`${date}T${endTime}`);

    if (eventStart <= new Date()) {
      setError("Event start time must be in the future.");
      setLoading(false);
      return;
    }

    if (eventEnd <= eventStart) {
      setError("End time must be after the start time.");
      setLoading(false);
      return;
    }

    try {
      const eventRef = doc(db, "events", id);
      await updateDoc(eventRef, {
        title,
        description,
        date,
        startTime,
        endTime,
        location,
        category,
      });
      setSuccess("Event updated successfully!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formPanel}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Edit Event</h1>
          <button 
            onClick={handleCancel}
            className={styles.cancelButton}
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
              placeholder="Enter event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Event Description</label>
            <textarea
              placeholder="Describe your event"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.dateInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={styles.timeInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={styles.timeInput}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Location</label>
            <input
              type="text"
              placeholder="Event location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              {loading ? "Updating Event..." : "Update Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;