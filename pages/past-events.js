import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { auth } from "../firebase/firebaseConfig";
import styles from "../styles/dashboard.module.css"; // Reusing existing styles
import { useEvents } from "../hooks/useEvents";

// Using the same EventCard component from joined-events.js
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

function PastEvents() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState(""); // Added timeframe filter
  const router = useRouter();
  
  // Use the custom hook to manage events
  const { 
    pastEvents, 
    loading, 
    error
  } = useEvents();

  // Handle auth state change
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

  // Filter events based on search, category, and timeframe
  const filteredPastEvents = pastEvents.filter((event) => {
    const matchesCategory = selectedCategory ? event.category === selectedCategory : true;
    
    // Filter by timeframe (last month, last 3 months, last 6 months, last year)
    let matchesTimeframe = true;
    if (selectedTimeframe) {
      const eventDate = new Date(event.date);
      const now = new Date();
      let monthsAgo;
      
      switch (selectedTimeframe) {
        case "lastMonth":
          monthsAgo = 1;
          break;
        case "last3Months":
          monthsAgo = 3;
          break;
        case "last6Months":
          monthsAgo = 6;
          break;
        case "lastYear":
          monthsAgo = 12;
          break;
        default:
          monthsAgo = 0;
      }
      
      if (monthsAgo > 0) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(now.getMonth() - monthsAgo);
        matchesTimeframe = eventDate >= cutoffDate;
      }
    }
    
    const matchesSearch = search 
      ? event.title?.toLowerCase().includes(search.toLowerCase()) ||
        event.location?.toLowerCase().includes(search.toLowerCase())
      : true;
    
    return matchesCategory && matchesSearch && matchesTimeframe;
  });

  // Extract unique categories for filter dropdown
  const categories = [...new Set(pastEvents.map(event => event.category))].filter(Boolean);

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
          <h1 className={styles.dashboardTitle}>Past Events</h1>
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
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className={styles.filterButton}
              aria-label="Filter by timeframe"
            >
              <option value="">All Time</option>
              <option value="lastMonth">Last Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="last6Months">Last 6 Months</option>
              <option value="lastYear">Last Year</option>
            </select>
          </div>
        </section>

        {/* Past Events List */}
        <section className={styles.pastEventsList}>
          <h2>🗓 Past Events ({filteredPastEvents.length})</h2>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : filteredPastEvents.length === 0 ? (
            <div className={styles.noEventsContainer}>
              <p>No past events match your filters.</p>
              {selectedCategory || selectedTimeframe || search ? (
                <button 
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedTimeframe("");
                    setSearch("");
                  }}
                  className={styles.menuButton}
                >
                  Clear Filters
                </button>
              ) : (
                <p>You haven't attended any events yet that have ended.</p>
              )}
            </div>
          ) : (
            <div className={styles.eventGrid}>
              {filteredPastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={() => {}} // No-op for past events
                  onLeave={() => {}} // No-op for past events
                  onEdit={() => {}} // No-op for past events
                  onDelete={() => {}} // No-op for past events
                />
              ))}
            </div>
          )}
        </section>

        {/* Analytics Section */}
        <section className={styles.analyticsSection}>
          <h2>📊 Event Analytics</h2>
          <div className={styles.analyticsContent}>
            <p>Total Past Events: <strong>{pastEvents.length}</strong></p>
            <p>Most Attended Category: <strong>{getMostAttendedCategory(pastEvents)}</strong></p>
            <p>Average Event Size: <strong>{getAverageEventSize(pastEvents)} participants</strong></p>
          </div>
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

// Helper function to get most attended category
function getMostAttendedCategory(events) {
  if (!events || events.length === 0) return "N/A";
  
  const categoryCount = {};
  let maxCount = 0;
  let mostAttendedCategory = "N/A";
  
  events.forEach(event => {
    const category = event.category || "Uncategorized";
    categoryCount[category] = (categoryCount[category] || 0) + 1;
    
    if (categoryCount[category] > maxCount) {
      maxCount = categoryCount[category];
      mostAttendedCategory = category;
    }
  });
  
  return mostAttendedCategory;
}

// Helper function to get average event size
function getAverageEventSize(events) {
  if (!events || events.length === 0) return 0;
  
  const totalParticipants = events.reduce((sum, event) => sum + (event.participants?.length || 0), 0);
  return Math.round(totalParticipants / events.length);
}

export default PastEvents;