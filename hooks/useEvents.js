import { useState, useEffect, useCallback } from "react";
import { 
  getEvents, 
  joinEvent, 
  leaveEvent, 
  getEventParticipants, 
  getUserJoinedEvents 
} from "../firebase/firebaseEvents";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { sendNotification } from "../firebase/NotificationService";

// Helper function to check if the browser supports notifications
const isNotificationSupported = () => {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
};

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Helper function to determine event status
  const getEventStatus = (eventDate, startTime, endTime) => {
    const now = new Date();
    const eventStart = new Date(`${eventDate} ${startTime}`);
    const eventEnd = new Date(`${eventDate} ${endTime}`);

    if (now >= eventEnd) return "Ended";
    if (now >= eventStart) return "Ongoing";
    return "Upcoming";
  };

  // Categorize events by status
  const categorizeEvents = useCallback((eventsList) => {
    const user = auth.currentUser;
    
    if (eventsList.length > 0) {
      const joined = eventsList.filter(event => 
        event.participants?.includes(user?.uid)
      );
      
      const past = eventsList.filter(event => 
        event.status === "Ended" || event.status === "Canceled"
      );
      
      const upcoming = eventsList.filter(event => 
        event.status === "Upcoming" || event.status === "Ongoing"
      );
      
      setJoinedEvents(joined);
      setPastEvents(past);
      setUpcomingEvents(upcoming);
    }
  }, []);

  // Fetch events and their participants
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      // Get all events
      const eventsList = await getEvents();
      
      // Get joined events specifically
      let userJoinedEvents = [];
      if (user) {
        userJoinedEvents = await getUserJoinedEvents(user.uid);
      }
      
      // Merge and update events with participants and status
      const updatedEvents = await Promise.all(
        eventsList.map(async (event) => {
          try {
            // Fetch participants IDs (not full details)
            const participants = await getEventParticipants(event.id);
            // Calculate current status
            const status = getEventStatus(event.date, event.startTime, event.endTime);
            
            // Return event with updated data
            return { 
              ...event, 
              participants,
              status 
            };
          } catch (participantError) {
            console.error("Error processing event:", event.id, participantError);
            // Return with default values if error
            return { 
              ...event, 
              participants: [],
              status: event.status || "Upcoming"
            };
          }
        })
      );
      
      setEvents(updatedEvents);
      categorizeEvents(updatedEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [categorizeEvents]);

  // Handle joining an event
// hooks/useEvents.js
const handleJoinEvent = async (eventId) => {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be signed in to join an event.");
    return false;
  }

  try {
    const result = await joinEvent(eventId);
    
    if (result.success) {
      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId
            ? { ...event, participants: [...(event.participants || []), user.uid] }
            : event
        )
      );
      
      // Fetch events again to update all categories
      fetchEvents();

      // Send notification if supported
      if (isNotificationSupported() && result.event) {
        await sendNotification({
          userId: user.uid,
          type: "event_joined",
          message: `You've successfully joined the event: ${result.event.title}`,
          channel: "in-app",
        });
      }

      return true;
    } else {
      alert(result.message);
      return false;
    }
  } catch (err) {
    console.error("Error joining event:", err);
    alert(err.message || "Failed to join event. Please try again later.");
    return false;
  }
};

  // Handle leaving an event
  const handleLeaveEvent = async (eventId) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to leave an event.");
      return false;
    }

    try {
      const result = await leaveEvent(eventId);
      
      if (result.success) {
        // Update local state
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === eventId
              ? { 
                  ...event, 
                  participants: event.participants?.filter((id) => id !== user.uid) || []
                }
              : event
          )
        );
        
        // Fetch events again to update all categories
        fetchEvents();

        // Send notification if supported
        if (isNotificationSupported()) {
          await sendNotification({
            userId: user.uid,
            type: "event_left",
            message: `You've left the event: ${result.event.title}`,
            channel: "in-app",
          });
        }

        return true;
      } else {
        alert(result.message);
        return false;
      }
    } catch (err) {
      console.error("Error leaving event:", err);
      alert(err.message || "Failed to leave event. Please try again later.");
      return false;
    }
  };

  // Set up real-time updates for events
  useEffect(() => {
    fetchEvents();

    // Listen for real-time updates
    const unsubscribe = onSnapshot(collection(db, "events"), () => {
      fetchEvents(); // Refetch all data when any event changes
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [fetchEvents]);

  // Listen for auth state changes to update joined events
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Re-categorize events when user signs in/out
        categorizeEvents(events);
      }
    });
    
    return () => unsubAuth();
  }, [events, categorizeEvents]);

  return { 
    events, 
    joinedEvents,
    pastEvents,
    upcomingEvents,
    loading, 
    error, 
    handleJoinEvent, 
    handleLeaveEvent,
    refreshEvents: fetchEvents
  };
};