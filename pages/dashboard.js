import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { auth, db } from "../firebase/firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";
import styles from "../styles/dashboard.module.css";
import { useEvents } from "../hooks/useEvents";

const categories = [
  "Music", "Sports", "Tech", "Education", "Health", "Business", "Art", "Entertainment"
];

// Reusable EventCard Component
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

function Dashboard() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  
  // Use the custom hook to manage events
  const { 
    // Removed unused 'events' variable
    joinedEvents, 
    pastEvents,
    upcomingEvents,
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

  // Handle user sign-out
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Handle joining an event
  const handleEventJoin = async (eventId) => {
    const success = await handleJoinEvent(eventId);
    if (success) {
      alert("You have successfully joined the event!");
      refreshEvents(); // Refresh events to update counts
    }
  };

  // Handle leaving an event
  const handleEventLeave = async (eventId) => {
    const success = await handleLeaveEvent(eventId);
    if (success) {
      alert("You have successfully left the event!");
      refreshEvents(); // Refresh events to update counts
    }
  };

  // Handle deleting an event
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, "events", eventId));
        alert("Event deleted successfully!");
        refreshEvents(); // Refresh events after deletion
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  // Filter events based on search and category
  const filteredUpcomingEvents = upcomingEvents.filter((event) => {
    const matchesCategory = selectedCategory ? event.category === selectedCategory : true;
    const matchesSearch = search 
      ? event.title?.toLowerCase().includes(search.toLowerCase()) 
      : true;
    return matchesCategory && matchesSearch;
  });

  // Limit the number of displayed events to 3
  const displayedUpcomingEvents = filteredUpcomingEvents.slice(0, 3);

  // Toggle hamburger menu
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const mobileNav = document.querySelector(`.${styles.mobileNav}`);
      const hamburger = document.querySelector(`.${styles.hamburger}`);

      if (
        isMenuOpen &&
        mobileNav &&
        hamburger &&
        !mobileNav.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);

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
          <h1 className={styles.dashboardTitle}>EventEase</h1>

          {/* Desktop Navigation */}
          <div className={styles.desktopNav}>
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

            <Link href="/create-event">
              <button className={styles.menuButton}>Create Event</button>
            </Link>

            <Link href="/events">
              <button className={styles.menuButton}>View All Events</button>
            </Link>

            <span className={styles.username}>{user?.displayName || user?.email}</span>

            <button className={styles.menuButton}>Notifications (3)</button>

            <button onClick={handleSignOut} className={styles.menuButton}>
              Logout
            </button>
          </div>

          {/* Hamburger Icon - Mobile Only */}
          <button
            className={styles.hamburger}
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>

          {/* Mobile Navigation Menu */}
          <div
            className={`${styles.mobileNav} ${isMenuOpen ? styles.menuOpen : ""}`}
            aria-hidden={!isMenuOpen}
          >
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

            <Link href="/create-event">
              <button className={styles.menuButton}>Create Event</button>
            </Link>

            <Link href="/events">
              <button className={styles.menuButton}>View All Events</button>
            </Link>

            <span className={styles.username}>{user?.displayName || user?.email}</span>

            <button className={styles.menuButton}>Notifications (3)</button>

            <button onClick={handleSignOut} className={styles.menuButton}>
              Logout
            </button>
          </div>
        </header>

        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
          <p className={styles.welcomeText}>
            Welcome back, <span className={styles.userName}>{user?.displayName || user?.email}</span>! 👋
          </p>
          <div className={styles.eventSummary}>
            <span>Upcoming Events: <strong>{upcomingEvents.length}</strong></span>
            <span>Joined Events: <strong>{joinedEvents.length}</strong></span>
            <span>Past Events: <strong>{pastEvents.length}</strong></span>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className={styles.upcomingEvents}>
          <h2>📅 Upcoming Events</h2>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : displayedUpcomingEvents.length === 0 ? (
            <p>No upcoming events available.</p>
          ) : (
            <div className={styles.eventGrid}>
              {displayedUpcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={handleEventJoin}
                  onLeave={handleEventLeave}
                  onDelete={handleDeleteEvent}
                  onEdit={(eventId) => router.push(`/edit-event/${eventId}`)}
                />
              ))}
            </div>
          )}
          {filteredUpcomingEvents.length > 3 && (
            <Link href="/events">
              <a className={styles.viewMore}>View More...</a>
            </Link>
          )}
        </section>

        {/* Joined Events */}
        <section className={styles.joinedEvents}>
          <h2>✅ My Joined Events ({joinedEvents.length})</h2>
          {joinedEvents.length === 0 ? (
            <p>You haven&apos;t joined any events yet.</p>
          ) : (
            <div className={styles.eventGrid}>
              {joinedEvents.slice(0, 3).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={handleEventJoin}
                  onLeave={handleEventLeave}
                  onDelete={handleDeleteEvent}
                  onEdit={(eventId) => router.push(`/edit-event/${eventId}`)}
                />
              ))}
            </div>
          )}
          {joinedEvents.length > 3 && (
            <a href="#" className={styles.viewMore}>View All Joined Events...</a>
          )}
        </section>

        {/* Past Events Section */}
        <section className={styles.pastEvents}>
          <h2>🗓 Past Events ({pastEvents.length})</h2>
          {pastEvents.length === 0 ? (
            <p>No past events found.</p>
          ) : (
            <div className={styles.eventGrid}>
              {pastEvents.slice(0, 3).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={handleEventJoin}
                  onLeave={handleEventLeave}
                  onDelete={handleDeleteEvent}
                  onEdit={(eventId) => router.push(`/edit-event/${eventId}`)}
                />
              ))}
            </div>
          )}
          {pastEvents.length > 3 && (
            <a href="#" className={styles.viewMore}>View All Past Events...</a>
          )}
        </section>

        {/* Notifications */}
        <section className={styles.notifications}>
          <h2>🔔 Notifications</h2>
          <div className={styles.notificationList}>
            <div className={styles.notification}>
              <span className={styles.icon}>📢</span>
              <p>Event &quot;Music Fest&quot; starts in 2 days!</p>
              <button className={styles.markRead}>Mark as Read</button>
            </div>
            <div className={styles.notification}>
              <span className={styles.icon}>❌</span>
              <p>Event &quot;Tech Meetup&quot; was canceled.</p>
              <button className={styles.markRead}>Mark as Read</button>
            </div>
            <div className={styles.notification}>
              <span className={styles.icon}>📩</span>
              <p>Verify your email to access all features.</p>
              <button className={styles.markRead}>Mark as Read</button>
            </div>
          </div>
          <button className={styles.clearAll}>Clear All</button>
        </section>

        {/* Profile & Settings */}
        <section className={styles.profileSettings}>
          <h2>👤 Profile & Settings</h2>
          <div className={styles.profileActions}>
            <button className={styles.menuButton}>Edit Profile</button>
            <button className={styles.menuButton}>Change Password</button>
            <button className={styles.menuButton}>Privacy Settings</button>
            <button className={styles.menuButton}>Dark Mode</button>
          </div>
        </section>

        {/* Insights */}
        <section className={styles.insights}>
          <h2>📊 Insights</h2>
          <div className={styles.insightsContent}>
            <p>🎉 Most Popular Event: &quot;Music Fest&quot; (500 participants)</p>
            <p>🤔 Events You Might Like: &quot;Art Expo&quot; | &quot;Tech Conference&quot;</p>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.dashboardFooter}>
          <p>{new Date().toLocaleDateString()} • EventEase v1.0</p>
          <div className={styles.socialLinks}>
            <a href="#">Twitter</a>
            <a href="#">Facebook</a>
            <a href="#">Instagram</a>
          </div>
          <a href="#" className={styles.contactSupport}>Contact Support</a>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;