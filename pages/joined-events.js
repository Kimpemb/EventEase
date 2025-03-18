import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { auth } from "../firebase/firebaseConfig";
import styles from "../styles/dashboard.module.css"; // Reusing existing styles
import { useEvents } from "../hooks/useEvents";

// Reuse EventCard component from dashboard.js
const EventCard = ({ event, onJoin, onLeave, onDelete, onEdit }) => {
  const user = auth.currentUser;
  const isOrganizer = user?.uid === event.userId;
  const isParticipant = event.participants?.includes(user?.uid);

  return (
    <div className={styles.eventCard}>
      <h3>{event.title}</h3>
      <p>Date: {new Date(event.date).toLocaleDateString()} | Time: {event.startTime} - {event.endTime}</p>
      <p>Location: {event.location}</p>
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
      {isOrganizer && (
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

function JoinedEvents() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(""); // Added status filter
  const router = useRouter();
  
  // Use the custom hook to manage events
  const { 
    joinedEvents, 
    loading, 
    error, 
    handleJoinEvent, 
    handleLeaveEvent,
    refreshEvents
  } = useEvents();

  // Handle auth state change
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace("/signin");
        return;
      }
      setUser(user);
    });

    return () => {
      unsubscribeAuth();
    };
  }, [router]);

  // Handle event leave
  const handleEventLeave = async (eventId) => {
    const success = await handleLeaveEvent(eventId);
    if (success) {
      alert("You have successfully left the event!");
      refreshEvents(); // Refresh events to update counts
    }
  };

  // Filter events based on search, category, and status
  const filteredJoinedEvents = joinedEvents.filter((event) => {
    const matchesCategory = selectedCategory ? event.category === selectedCategory : true;
    const matchesStatus = selectedStatus ? event.status === selectedStatus : true;
    const matchesSearch = search 
      ? event.title?.toLowerCase().includes(search.toLowerCase()) ||
        event.location?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesCategory && matchesSearch && matchesStatus;
  });

  // Extract unique categories for filter dropdown
  const categories = [...new Set(joinedEvents.map(event => event.category))].filter(Boolean);
  
  // Extract unique statuses for filter dropdown
  const statuses = [...new Set(joinedEvents.map(event => event.status))].filter(Boolean);

  // Handle going back to dashboard
  const goBackToDashboard = () => {
    router.push("/dashboard");
  };

  // Show loading state
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
          <h1 className={styles.dashboardTitle}>My Joined Events</h1>
          <button onClick={goBackToDashboard} className={styles.menuButton}>
            Back to Dashboard
          </button>
        </header>

        {/* Filters */}
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

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterButton}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Joined Events List */}
        <section className={styles.joinedEventsList}>
          <h2>✅ My Joined Events ({filteredJoinedEvents.length})</h2>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : filteredJoinedEvents.length === 0 ? (
            <div className={styles.noEventsContainer}>
              <p>No joined events match your filters.</p>
              {selectedCategory || selectedStatus || search ? (
                <button 
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedStatus("");
                    setSearch("");
                  }}
                  className={styles.menuButton}
                >
                  Clear Filters
                </button>
              ) : (
                <>
                  <p>Browse available events to join one!</p>
                  <Link href="/events">
                    <a className={styles.menuButton}>Browse Events</a>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className={styles.eventGrid}>
              {filteredJoinedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={handleJoinEvent}
                  onLeave={handleEventLeave}
                  onEdit={(eventId) => router.push(`/edit-event/${eventId}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
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

export default JoinedEvents;