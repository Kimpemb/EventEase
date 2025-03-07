import { useEffect, useState } from "react";
import { getEvents, joinEvent, leaveEvent, getEventParticipants } from "../firebase/firebaseEvents";
import { auth } from "../firebase/firebaseConfig";
import styles from "../styles/Events.module.css";

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
        const updatedEvents = await Promise.all(
          eventsList.map(async (event) => {
            try {
              const participantEmails = await getEventParticipants(event.id);
              return { ...event, participantEmails };
            } catch (participantError) {
              console.error("Error fetching participants:", participantError);
              return { ...event, participantEmails: [] };
            }
          })
        );
        setEvents(updatedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleJoinEvent = async (event) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to join an event.");
      return;
    }
    if (event.status === "Ended" || event.status === "Cancelled") {
      alert("You cannot join this event.");
      return;
    }
    if (event.participants?.includes(user.uid)) {
      alert("You have already joined this event.");
      return;
    }

    try {
      await joinEvent(event.id);
      alert("You have successfully joined the event!");
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === event.id
            ? { ...e, participants: [...(e.participants || []), user.uid] }
            : e
        )
      );
    } catch (err) {
      console.error("Error joining event:", err);
      alert(err.message || "Failed to join event. Please try again later.");
    }
  };

  const handleLeaveEvent = async (event) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to leave an event.");
      return;
    }
    if (event.status === "Ended" || event.status === "Cancelled") {
      alert("You cannot leave this event.");
      return;
    }
    if (!event.participants?.includes(user.uid)) {
      alert("You are not a participant of this event.");
      return;
    }

    try {
      await leaveEvent(event.id);
      alert("You have successfully left the event!");
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === event.id
            ? { ...e, participants: e.participants?.filter((id) => id !== user.uid) }
            : e
        )
      );
    } catch (err) {
      console.error("Error leaving event:", err);
      alert(err.message || "Failed to leave event. Please try again later.");
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory ? event.category === selectedCategory : true;
    const matchesSearch = search ? event.title?.toLowerCase().includes(search.toLowerCase()) : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Events</h1>
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.select}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className={styles.loading}>Loading events...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <div className={styles.eventsContainer}>
          {filteredEvents.length === 0 ? (
            <p className={styles.noEvents}>No events available.</p>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <h2 className={styles.eventTitle}>{event.title}</h2>
                <p className={styles.eventDetails}>{event.description}</p>
                <p className={styles.eventDetails}>
                  Date: {new Date(event.date).toLocaleDateString()} | Time: {event.startTime} - {event.endTime}
                </p>
                <p className={styles.eventDetails}>Location: {event.location}</p>
                <p className={styles.category}>Category: {event.category || "Uncategorized"}</p>
                <p className={styles.organizer}>Organizer: {event.organizer || "Unknown"}</p>
                <p className={styles.status}>Status: {event.status || "Upcoming"}</p>
                {auth.currentUser && auth.currentUser.uid !== event.userId && event.status === "Upcoming" && (
                  <div className={styles.buttonContainer}>
                    {event.participants?.includes(auth.currentUser?.uid) ? (
                      <button
                        onClick={() => handleLeaveEvent(event)}
                        className={styles.leaveButton}
                      >
                        Leave Event
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinEvent(event)}
                        className={styles.joinButton}
                      >
                        Join Event
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;