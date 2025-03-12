import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import styles from "../styles/dashboard.module.css";

const EditEventPage = () => {
  const router = useRouter();
  const { id } = router.query; // Use `id` instead of `eventId` to match the dynamic route
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    status: "Upcoming",
  });

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return; // Use `id` instead of `eventId`
      const eventRef = doc(db, "events", id);
      try {
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
          setFormData(eventDoc.data()); // Pre-fill form with event data
        } else {
          alert("Event not found!");
          router.push("/dashboard"); // Redirect if event doesn't exist
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        alert("Failed to load event. Please try again.");
      } finally {
        setLoading(false); // Ensure loading is set to false
      }
    };
    fetchEvent();
  }, [id, router]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventRef = doc(db, "events", id);
      await updateDoc(eventRef, formData);
      alert("Event updated successfully!");
      router.push("/dashboard"); // Redirect to dashboard after update
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event. Please try again.");
    }
  };

  if (loading) {
    return <p>Loading...</p>; // Show loading state
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardPanel}>
        <h1>Edit Event</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Event Title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
          <textarea
            name="description"
            placeholder="Event Description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Event Location"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Category</option>
            <option value="Music">Music</option>
            <option value="Sports">Sports</option>
            <option value="Tech">Tech</option>
            <option value="Education">Education</option>
            <option value="Health">Health</option>
            <option value="Business">Business</option>
            <option value="Art">Art</option>
            <option value="Entertainment">Entertainment</option>
          </select>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
          >
            <option value="Upcoming">Upcoming</option>
            <option value="Ended">Ended</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button type="submit">Update Event</button>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;