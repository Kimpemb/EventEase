import { useEffect, useState } from "react";
import { getEvents, joinEvent, getEventParticipants } from "../firebase/firebaseEvents";
import { auth } from "../firebase/firebaseConfig";
import styles from '../styles/Events.module.css';

const categories = ["Music", "Sports", "Tech", "Education", "Health", "Business", "Art", "Entertainment"];

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
        const updatedEvents = await Promise.all(eventsList.map(async (event) => {
          if (auth.currentUser?.uid === event.userId) {
            try {
              const participantEmails = await getEventParticipants(event.id);
              return { ...event, participantEmails };
            } catch {
              return { ...event, participantEmails: [] };
            }
          }
          return { ...event, participantEmails: null };
        }));
        setEvents(updatedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleJoinEvent = async (event) => {
    const eventStartTime = new Date(`${event.date} ${event.time}`);
    const now = new Date();

    if (now >= eventStartTime) {
      alert("This event has already started. You cannot join.");
      return;
    }

    try {
      await joinEvent(event.id);
      alert("You have successfully joined the event!");
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === event.id
            ? { ...e, participants: [...e.participants, auth.currentUser.uid] }
            : e
        )
      );
    } catch (err) {
      alert(err.message || "Failed to join event.");
    }
  };

  const filteredEvents = events.filter(event =>
    (selectedCategory ? event.category === selectedCategory : true) &&
    (search ? event.title?.toLowerCase().includes(search.toLowerCase()) : true)
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Events</h1>

      <div className={styles.filters}>
        <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className={styles.input} />
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={styles.select}>
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
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
            filteredEvents.map((event) => {
              const eventStartTime = new Date(`${event.date} ${event.time}`);
              const now = new Date();
              const hasStarted = now >= eventStartTime;
              const alreadyJoined = event.participants?.includes(auth.currentUser?.uid);
              const isOrganizer = auth.currentUser?.uid === event.userId;

              return (
                <div key={event.id} className={styles.eventCard}>
                  <h2 className={styles.eventTitle}>{event.title}</h2>
                  <p className={styles.eventDetails}>{event.description}</p>
                  <p className={styles.eventDetails}>Date: {new Date(event.date).toLocaleDateString()} | Time: {event.time}</p>
                  <p className={styles.eventDetails}>Location: {event.location}</p>
                  <p className={styles.category}>Category: {event.category || "Uncategorized"}</p>
                  <p className={styles.organizer}>Organizer: {event.organizer || "Unknown"}</p>
                  <button onClick={() => handleJoinEvent(event)} disabled={alreadyJoined || hasStarted} className={styles.joinButton}>
                    {alreadyJoined ? "Joined" : hasStarted ? "Event Started" : "Join Event"}
                  </button>

                  {isOrganizer && (
                    <div className={styles.participantsList}>
                      <h3>Participants:</h3>
                      {event.participantEmails ? (
                        <ul>
                          {event.participantEmails.length > 0 ? (
                            event.participantEmails.map((email, index) => <li key={index}>{email}</li>)
                          ) : (
                            <p>No participants yet.</p>
                          )}
                        </ul>
                      ) : (
                        <p>Loading participants...</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
