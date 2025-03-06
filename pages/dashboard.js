import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../firebase/firebaseConfig";
import { getOrganizerEvents, getEventParticipants } from "../firebase/firebaseEvents";
import Link from "next/link";
import styles from "../styles/dashboard.module.css";

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const router = useRouter();

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

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace("/signin");
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
          <h1 className={styles.dashboardTitle}>Dashboard</h1>
          <button onClick={handleSignOut} className={styles.signOut}>Sign Out</button>
        </header>

        <section className={styles.welcomeSection}>
          <p className={styles.welcomeText}>
            Welcome back, <span className={styles.userName}>{user.displayName || user.email}</span>!
          </p>
        </section>

        <section className={styles.actionsSection}>
          <Link href="/events" passHref>
            <button className={`${styles.dashboardButton} ${styles.viewEvents}`}>View All Events</button>
          </Link>

          <Link href="/create-event" passHref>
            <button className={`${styles.dashboardButton} ${styles.createEvent}`}>Create Event</button>
          </Link>
        </section>

        <section className={styles.organizerEvents}>
          <h2>Your Events & Participants</h2>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : events.length === 0 ? (
            <p>No events created yet.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <h3>{event.title}</h3>
                <p>{event.date} at {event.time}</p>
                <p>Location: {event.location}</p>
                <h4>Participants:</h4>
                {event.participants?.length > 0 ? (
                  <ul>
                    {event.participants.map((participant, index) => (
                      <li key={index}>
                        <strong>{participant.username || "Unknown"}</strong> ({participant.email || "No email provided"})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No participants yet.</p>
                )}
              </div>
            ))
          )}
        </section>

        <footer className={styles.dashboardFooter}>
          {new Date().toLocaleDateString()} • Dashboard v1.0
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
