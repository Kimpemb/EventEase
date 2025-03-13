import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { auth, db } from "../firebase/firebaseConfig";
import { getOrganizerEvents, getEventParticipants, joinEvent, leaveEvent } from "../firebase/firebaseEvents";
import { doc, deleteDoc } from "firebase/firestore";
import styles from "../styles/dashboard.module.css";

const categories = [
  "Music", "Sports", "Tech", "Education", "Health", "Business", "Art", "Entertainment"
];

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for hamburger menu
  const router = useRouter();

  // Fetch user and events on component mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace("/signin");
        return;
      }
      setUser(user);
      setLoading(false);

      try {
        const userEvents = await getOrganizerEvents(user.uid);
        const eventsWithParticipants = await Promise.all(
          userEvents.map(async (event) => {
            const participants = (await getEventParticipants(event.id)) || [];
            return { ...event, participants };
          })
        );
        setEvents(eventsWithParticipants);
      } catch (error) {
        console.error("Error fetching organizer events:", error);
        setError("Failed to load events. Please try again later.");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Calculate counts dynamically
  const upcomingEventsCount = events.filter(
    (event) => event.status === "Upcoming"
  ).length;

  const joinedEventsCount = events.filter(
    (event) => event.participants?.includes(auth.currentUser?.uid)
  ).length;

  const pastEventsCount = events.filter(
    (event) => event.status === "Ended" || event.status === "Cancelled"
  ).length;

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

  // Handle leaving an event
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

  // Handle deleting an event
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, "events", eventId)); // Delete event from Firestore
        setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId)); // Update UI
        alert("Event deleted successfully!");
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  // Filter events based on search, category, and status
  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory ? event.category === selectedCategory : true;
    const matchesSearch = search ? event.title?.toLowerCase().includes(search.toLowerCase()) : true;
    const isUpcoming = event.status === "Upcoming"; // Only include upcoming events
    return matchesCategory && matchesSearch && isUpcoming;
  });

  // Limit the number of displayed events to 3
  const displayedEvents = filteredEvents.slice(0, 3);

  // Toggle hamburger menu
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev); // Toggle the state
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const mobileNav = document.querySelector(`.${styles.mobileNav}`);
      const hamburger = document.querySelector(`.${styles.hamburger}`);

      // Close the menu if the click is outside the menu and not on the hamburger icon
      if (
        isMenuOpen &&
        mobileNav &&
        !mobileNav.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    // Attach the event listener
    document.addEventListener("click", handleClickOutside);

    // Cleanup the event listener
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

            <Link href="/create-event" passHref>
              <button className={styles.menuButton}>Create Event</button>
            </Link>

            <Link href="/events" passHref>
              <button className={styles.menuButton}>View All Events</button>
            </Link>

            <span className={styles.username}>{user.displayName || user.email}</span>

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

            <Link href="/create-event" passHref>
              <button className={styles.menuButton}>Create Event</button>
            </Link>

            <Link href="/events" passHref>
              <button className={styles.menuButton}>View All Events</button>
            </Link>

            <span className={styles.username}>{user.displayName || user.email}</span>

            <button className={styles.menuButton}>Notifications (3)</button>

            <button onClick={handleSignOut} className={styles.menuButton}>
              Logout
            </button>
          </div>
        </header>

        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
          <p className={styles.welcomeText}>
            Welcome back, <span className={styles.userName}>{user.displayName || user.email}</span>! 👋
          </p>
          <div className={styles.eventSummary}>
            <span>Upcoming Events: <strong>{upcomingEventsCount}</strong></span>
            <span>Joined Events: <strong>{joinedEventsCount}</strong></span>
            <span>Past Events: <strong>{pastEventsCount}</strong></span>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className={styles.upcomingEvents}>
          <h2>📅 Upcoming Events</h2>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : displayedEvents.length === 0 ? (
            <p>No upcoming events available.</p>
          ) : (
            <div className={styles.eventGrid}>
              {displayedEvents.map((event) => (
                <div key={event.id} className={styles.eventCard}>
                  <h3>{event.title}</h3>
                  <p>Date: {event.date} | Time: {event.time}</p>
                  <p>Location: {event.location}</p>
                  <p>Category: {event.category || "Uncategorized"}</p>
                  <p>Organizer: {event.organizer || "Unknown"}</p>
                  <p>Status: {event.status || "Upcoming"}</p>
                  <h4>Participants:</h4>
                  {event.participants?.length > 0 ? (
                    <ul className={styles.participantsList}>
                      {event.participants.map((participant, index) => (
                        <li key={index}>
                          <strong>{participant.username || "Unknown"}</strong> ({participant.email || "No email provided"})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No participants yet.</p>
                  )}
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
                  {/* Add Edit and Delete Buttons */}
                  {auth.currentUser && auth.currentUser.uid === event.userId && (
                    <div className={styles.buttonContainer}>
                      <button
                        onClick={() => {
                          console.log("Edit Button Clicked - Event ID:", event.id); // Log the event ID
                          router.push(`/edit-event/${event.id}`);
                        }}
                        className={styles.menuButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className={styles.leaveButton}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {filteredEvents.length > 3 && (
            <a href="#" className={styles.viewMore}>View More...</a>
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
};

export default DashboardPage;