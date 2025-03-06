import { useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../firebase/firebaseConfig"; 
import { createEvent } from "../firebase/firebaseEvents"; 
import styles from "../styles/createEvent.module.css"; 

const CreateEventPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("General");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to create an event.");
      setLoading(false);
      return;
    }

    const eventDateTime = new Date(`${date}T${time}`);
    if (eventDateTime <= new Date()) {
      setError("Event date and time must be in the future.");
      setLoading(false);
      return;
    }

    try {
      await createEvent({
        title,
        description,
        date,
        time,
        location,
        category,
        userId: user.uid,
        organizer: user.displayName || "Unknown Organizer",
      });
      setSuccess("Event created successfully!");

      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setLocation("");
      setCategory("General");

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
          <h1 className={styles.formTitle}>Create Event</h1>
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
              <label className={styles.inputLabel}>Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
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
              {loading ? "Creating Event..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;