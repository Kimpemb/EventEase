import { useEffect, useState } from "react";
import { getEvents } from "../firebase/firebaseEvents"; // Import the function to get events

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="flex flex-col items-center p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Events</h1>

      {loading ? (
        <p className="text-blue-500">Loading events...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-6 w-full max-w-4xl">
          {events.length === 0 ? (
            <p className="text-gray-500">No events available.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800">{event.title}</h2>
                <p className="text-gray-600">{event.description}</p>
                <p className="text-gray-500">
                  Date: {new Date(event.date).toLocaleDateString()} | Time: {event.time}
                </p>
                <p className="text-gray-500">Location: {event.location}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
