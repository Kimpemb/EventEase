import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { auth } from "../firebase/firebaseConfig";
import styles from "../styles/dashboard.module.css";
import { useEvents } from "../hooks/useEvents";

const EventCard = ({ event, onJoin, onLeave, onDelete, onEdit }) => {
  const user = auth.currentUser;
  const isOrganizer = user?.uid === event.userId;
  const isParticipant = event.participants?.includes(user?.uid);

  return (
    <div className={styles.eventCard}>
      <h3>{event.title}</h3>
      <p>Date: {new Date(event.date).toLocaleDateString()} | Time: {event.startTime} - {event.endTime}</p>
      <p>Location: {event.location?.address || "Location not specified"}</p> {/* Fixed */}
      <p>Category: {event.category || "Uncategorized"}</p>
      <p>Organizer: {event.username || "Unknown"}</p>
      <p>Status: {event.status || "Upcoming"}</p>
      <p>Participants: {event.participants?.length || 0}</p>

      {!isOrganizer && event.status === "Upcoming" && (
        <div className={styles.buttonContainer}>
          {isParticipant ? (
            <button onClick={() => onLeave(event.id)} className={styles.leaveButton}>
              Leave Event
            </button>
          ) : (
            <button onClick={() => onJoin(event.id)} className={styles.joinButton}>
              Join Event
            </button>
          )}
        </div>
      )}
      {isOrganizer && event.status !== "Ended" && (
        <div className={styles.buttonContainer}>
          <button onClick={() => onEdit(event.id)} className={styles.menuButton}>
            Edit
          </button>
          <button onClick={() => onDelete(event.id)} className={styles.leaveButton}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

function UpcomingEvents() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const router = useRouter();

  const { 
    events, 
    loading, 
    error, 
    handleJoinEvent, 
    handleLeaveEvent 
  } = useEvents();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace("/signin");
        return;
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [router]);

  const filteredUpcomingEvents = events.filter((event) => {
    const matchesCategory = selectedCategory ? event.category === selectedCategory : true;
    const matchesSearch = search 
      ? event.title?.toLowerCase().includes(search.toLowerCase()) ||
        event.location?.address?.toLowerCase().includes(search.toLowerCase()) // Fixed: Use location.address
      : true;
    const isUpcoming = event.status === "Upcoming";
    return matchesCategory && matchesSearch && isUpcoming;
  });

  const categories = [...new Set(events.map(event => event.category))].filter(Boolean);

  const goBackToDashboard = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardPanel}>
        <header className={styles.dashboardHeader}>
          <h1 className={styles.dashboardTitle}>Upcoming Events</h1>
          <button onClick={goBackToDashboard} className={styles.menuButton}>
            Back to Dashboard
          </button>
        </header>

        <section className={styles.filtersSection}>
          <div className={styles.filterContainer}>
            <input
              type="text"
              placeholder="🔍 Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchBar}
              aria-label="Search events"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.filterButton}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className={styles.joinedEventsList}>
          <h2>📅 Upcoming Events ({filteredUpcomingEvents.length})</h2>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : filteredUpcomingEvents.length === 0 ? (
            <div className={styles.noEventsContainer}>
              <p>No upcoming events match your filters.</p>
              {selectedCategory || search ? (
                <button 
                  onClick={() => {
                    setSelectedCategory("");
                    setSearch("");
                  }}
                  className={styles.menuButton}
                >
                  Clear Filters
                </button>
              ) : (
                <>
                  <p>Check back later for new events!</p>
                  <Link href="/events" legacyBehavior>
                    <a className={styles.menuButton}>Browse All Events</a>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className={styles.eventGrid}>
              {filteredUpcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={handleJoinEvent}
                  onLeave={handleLeaveEvent}
                  onEdit={(eventId) => router.push(`/edit-event/${eventId}`)}
                />
              ))}
            </div>
          )}
        </section>

        <footer className={styles.dashboardFooter}>
          <p>{new Date().toLocaleDateString()} • EventEase v1.0</p>
          <button onClick={goBackToDashboard} className={styles.menuButton}>
            Back to Dashboard
          </button>
        </footer>
      </div>
    </div>
  );
}

export default UpcomingEvents;