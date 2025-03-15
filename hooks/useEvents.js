import { useState, useEffect } from "react";
import { getEvents, joinEvent, leaveEvent, getEventParticipants } from "../firebase/firebaseEvents";
import { auth } from "../firebase/firebaseConfig";

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch events from Firebase
  const fetchEvents = async () => {
    try {
      const eventsList = await getEvents();
      const updatedEvents = await Promise.all(
        eventsList.map(async (event) => {
          try {
            const participants = await getEventParticipants(event.id);
            return { ...event, participants };
          } catch (participantError) {
            console.error("Error fetching participants for event:", event.id, participantError);
            return { ...event, participants: [] }; // Fallback to empty array if participants fetch fails
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

  // Handle joining an event
  const handleJoinEvent = async (eventId) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to join an event.");
      return;
    }

    try {
      await joinEvent(eventId); // Call Firebase function to join the event
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
      await leaveEvent(eventId); // Call Firebase function to leave the event
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

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  return { events, loading, error, handleJoinEvent, handleLeaveEvent };
};