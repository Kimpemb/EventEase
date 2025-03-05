import { useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../firebase/firebaseConfig"; // Firebase config
import { createEvent } from "../firebase/firebaseEvents"; // Function to handle event creation

const CreateEventPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("General"); // New category state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
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

    // Validate the event date and time
    const eventDateTime = new Date(`${date}T${time}`);
    if (eventDateTime <= new Date()) {
      setError("Event date and time must be in the future.");
      setLoading(false);
      return;
    }

    try {
      // Create the event in Firestore with the organizer's name
      await createEvent({
        title,
        description,
        date,
        time,
        location,
        category, // Include category
        userId: user.uid, // Link the event to the logged-in user
        organizer: user.displayName || "Unknown Organizer", // Include organizer name
      });
      setSuccess("Event created successfully!");

      // Clear the form
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setLocation("");
      setCategory("General");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500); // 1.5 seconds delay
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Create Event</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <input
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <textarea
          placeholder="Event Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <div className="flex space-x-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="General">General</option>
          <option value="Music">Music</option>
          <option value="Sports">Sports</option>
          <option value="Education">Education</option>
          <option value="Entertainment">Entertainment</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white p-3 rounded w-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
          disabled={loading} // Disable button while loading
        >
          {loading ? "Creating Event..." : "Create Event"}
        </button>
      </form>
    </div>
  );
};

export default CreateEventPage;
