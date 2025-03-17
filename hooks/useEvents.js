import { useState, useEffect, useCallback } from "react";
import { getEvents, joinEvent, leaveEvent, getEventParticipants } from "../firebase/firebaseEvents";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

export const useEvents = () => {
  const [events, setEvents] = useState([]);
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

  // Fetch events and their participants
  const fetchEvents = useCallback(async () => {
    try {
      const eventsList = await getEvents();
      const updatedEvents = await Promise.all(
        eventsList.map(async (event) => {
          try {
            const participants = await getEventParticipants(event.id);
            const status = getEventStatus(event.date, event.startTime, event.endTime);
            return { ...event, participants, status };
          } catch (participantError) {
            console.error("Error fetching participants for event:", event.id, participantError);
            return { ...event, participants: [], status: "Upcoming" }; // Fallback
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
  }, []);

  // Handle joining an event
  const handleJoinEvent = async (eventId) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to join an event.");
      return;
    }

    try {
      await joinEvent(eventId);
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId
            ? { ...event, participants: [...(event.participants || []), user.uid] }
            : event
        )
      );
      alert("You have successfully joined the event!");
    } catch (err) {
      console.error("Error joining event:", err);
      alert(err.message || "Failed to join event. Please try again later.");
    }
  };

  // Handle leaving an event
  const handleLeaveEvent = async (eventId) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to leave an event.");
      return;
    }

    try {
      await leaveEvent(eventId);
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId
            ? { ...event, participants: event.participants?.filter((id) => id !== user.uid) }
            : event
        )
      );
      alert("You have successfully left the event!");
    } catch (err) {
      console.error("Error leaving event:", err);
      alert(err.message || "Failed to leave event. Please try again later.");
    }
  };

  // Fetch events on component mount and set up real-time updates
  useEffect(() => {
    fetchEvents();

    const unsubscribe = onSnapshot(collection(db, "events"), async (snapshot) => {
      const eventsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const updatedEvents = await Promise.all(
        eventsList.map(async (event) => {
          try {
            const participants = await getEventParticipants(event.id);
            const status = getEventStatus(event.date, event.startTime, event.endTime);
            return { ...event, participants, status };
          } catch (participantError) {
            console.error("Error fetching participants for event:", event.id, participantError);
            return { ...event, participants: [], status: "Upcoming" }; // Fallback
          }
        })
      );
      setEvents(updatedEvents);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [fetchEvents]);

  return { events, loading, error, handleJoinEvent, handleLeaveEvent };
};