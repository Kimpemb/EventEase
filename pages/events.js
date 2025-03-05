import { useEffect, useState } from "react";
import { getEvents } from "../firebase/firebaseEvents";

const categories = [
  "Music", "Sports", "Tech", "Education", "Health", "Business", "Art", "Entertainment"
];

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsList = await getEvents();
        setEvents(eventsList);
      } catch (err) {
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event =>
    (selectedCategory ? event.category === selectedCategory : true) &&
    (search ? event.title.toLowerCase().includes(search.toLowerCase()) : true)
  );

  return (
    <div className="flex flex-col items-center p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Events</h1>
      
      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-blue-500">Loading events...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-6 w-full max-w-4xl">
          {filteredEvents.length === 0 ? (
            <p className="text-gray-500">No events available.</p>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800">{event.title}</h2>
                <p className="text-gray-600">{event.description}</p>
                <p className="text-gray-500">
                  Date: {new Date(event.date).toLocaleDateString()} | Time: {event.time}
                </p>
                <p className="text-gray-500">Location: {event.location}</p>
                <p className="text-gray-500 font-semibold">
                  Category: {event.category || "Uncategorized"}
                </p>
                <p className="text-gray-500 font-semibold">
                  Organizer: {event.organizer || "Unknown"}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
