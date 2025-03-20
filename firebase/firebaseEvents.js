import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";


// Helper function to check if a user is authenticated
const checkAuth = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user;
};

// Helper function to validate event existence
const validateEvent = async (eventId) => {
  const eventRef = doc(db, "events", eventId);
  const eventSnap = await getDoc(eventRef);
  if (!eventSnap.exists()) throw new Error("Event not found");
  return { eventRef, eventData: eventSnap.data() };
};

// Function to send a notification to a user
export const sendNotification = async (userId, notification) => {
  try {
    await addDoc(collection(db, "users", userId, "notifications"), notification);
    console.log(`Notification sent to user ${userId}:`, notification); // Debugging log
  } catch (error) {
    console.error("Error sending notification:", error); // Debugging log
    throw new Error("Failed to send notification: " + error.message);
  }
};

// Function to send notifications to all participants of an event
export const sendNotificationToUsers = async (eventId, type, message) => {
  try {
    const participants = await getEventParticipants(eventId);
    console.log(`Participants for event ${eventId}:`, participants); // Debugging log

    if (participants.length === 0) {
      console.log("No participants to notify."); // Debugging log
      return;
    }

    await Promise.all(
      participants.map(async (userId) => {
        console.log(`Sending notification to user ${userId}`); // Debugging log
        await sendNotification(userId, {
          type,
          message,
          eventId,
          timestamp: serverTimestamp(),
        });
      })
    );

    console.log(`Notifications sent to participants for event ${eventId}`); // Debugging log
  } catch (error) {
    console.error("Error sending notifications:", error); // Debugging log
    throw new Error("Failed to send notifications. Please try again.");
  }
};

// Function to create an event in Firestore
export const createEvent = async (eventData) => {
  try {
    const user = checkAuth();

    const docRef = await addDoc(collection(db, "events"), {
      ...eventData,
      userId: user.uid,
      username: user.displayName || "Anonymous",
      category: eventData.category || "Uncategorized",
      participants: [],
      status: "Upcoming",
      createdAt: serverTimestamp(),
    });

    console.log("Event created with ID:", docRef.id); // Debugging log
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error); // Debugging log
    throw new Error("Failed to create event. Please try again.");
  }
};

// Function to get all events from Firestore
export const getEvents = async () => {
  try {
    const eventsSnapshot = await getDocs(collection(db, "events"));
    const now = new Date();

    const eventsList = await Promise.all(
      eventsSnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const eventStart = new Date(`${data.date} ${data.startTime}`);
        const eventEnd = new Date(`${data.date} ${data.endTime}`);

        let status = "Upcoming";
        if (now >= eventEnd) status = "Ended";
        else if (now >= eventStart) status = "Ongoing";

        // Update Firestore if status has changed
        if (status !== data.status) {
          await updateEventStatus(docSnap.id, status);
        }

        return { id: docSnap.id, ...data, status };
      })
    );

    return eventsList;
  } catch (error) {
    console.error("Error fetching events:", error); // Debugging log
    throw new Error("Failed to fetch events. Please try again.");
  }
};

// Function to get events created by a specific organizer
export const getOrganizerEvents = async (organizerId) => {
  try {
    const q = query(collection(db, "events"), where("userId", "==", organizerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching organizer events:", error); // Debugging log
    throw new Error("Failed to fetch organizer events. Please try again.");
  }
};

// Function to get events joined by a specific user
export const getUserJoinedEvents = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required");

    const q = query(
      collection(db, "events"),
      where("participants", "array-contains", userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching joined events:", error); // Debugging log
    throw new Error("Failed to fetch joined events. Please try again.");
  }
};

// Function to get a single event by ID
export const getEventById = async (eventId) => {
  try {
    const { eventData } = await validateEvent(eventId);
    return { id: eventId, ...eventData };
  } catch (error) {
    console.error("Error fetching event details:", error); // Debugging log
    throw new Error("Failed to fetch event details. Please try again.");
  }
};

// Function to join an event
export const joinEvent = async (eventId) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated.");
  }

  try {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error("Event not found.");
    }

    // Add the user to the event's participants list
    await updateDoc(eventRef, {
      participants: arrayUnion(user.uid),
    });

    // Return the event data
    return {
      success: true,
      event: eventDoc.data(),
    };
  } catch (error) {
    console.error("Error joining event:", error); // Debugging log
    return {
      success: false,
      message: error.message,
    };
  }
};

// Function to leave an event
export const leaveEvent = async (eventId) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated.");
  }

  try {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error("Event not found.");
    }

    const eventData = eventDoc.data();

    // Check if the event has already started or ended
    if (eventData.status !== "Upcoming") {
      throw new Error("Cannot leave an event that has already started or ended.");
    }

    // Check if the user is a participant
    if (!eventData.participants?.includes(user.uid)) {
      return { success: false, message: "You are not a participant of this event." };
    }

    // Remove the user from the event's participants list
    await updateDoc(eventRef, {
      participants: arrayRemove(user.uid),
    });

    // Return the event data
    return {
      success: true,
      event: eventData,
      message: "Successfully left the event.",
    };
  } catch (error) {
    console.error("Error leaving event:", error); // Debugging log
    return {
      success: false,
      message: error.message || "Failed to leave event. Please try again.",
    };
  }
};

// Function to update event status
export const updateEventStatus = async (eventId, status) => {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, { status });

    // Notify participants if the event is canceled
    if (status === "Canceled") {
      await sendNotificationToUsers(eventId, "event_canceled", "The event has been canceled.");
    }

    console.log(`Event ${eventId} updated to ${status}`); // Debugging log
  } catch (error) {
    console.error("Error updating event status:", error); // Debugging log
    throw new Error("Failed to update event status. Please try again.");
  }
};

// Function to update event details
export const updateEvent = async (eventId, updatedEventData) => {
  try {
    console.log(`Updating event ${eventId} with data:`, updatedEventData); // Debugging log

    // Validate event existence
    const { eventRef } = await validateEvent(eventId);
    console.log("Event exists and is valid:", eventRef.id); // Debugging log

    // Update event in Firestore
    await updateDoc(eventRef, updatedEventData);
    console.log("Event updated in Firestore"); // Debugging log

    // Notify participants about the update
    console.log(`Notifying participants of event ${eventId}`); // Debugging log
    await sendNotificationToUsers(eventId, "event_updated", "The event details have been updated.");

    console.log(`Event ${eventId} updated successfully`); // Debugging log
  } catch (error) {
    console.error("Error updating event:", error); // Debugging log
    throw new Error("Failed to update event. Please try again.");
  }
};

// Function to cancel an event
export const cancelEvent = async (eventId) => {
  try {
    console.log(`Canceling event ${eventId}`); // Debugging log

    // Validate event existence
    const { eventRef } = await validateEvent(eventId);
    console.log("Event exists and is valid:", eventRef.id); // Debugging log

    // Update event status to "Canceled"
    await updateDoc(eventRef, { status: "Canceled" });
    console.log("Event status updated to 'Canceled'"); // Debugging log

    // Notify participants about the cancellation
    console.log(`Notifying participants of event ${eventId}`); // Debugging log
    await sendNotificationToUsers(eventId, "event_canceled", "The event has been canceled.");

    console.log(`Event ${eventId} canceled successfully`); // Debugging log
  } catch (error) {
    console.error("Error canceling event:", error); // Debugging log
    throw new Error("Failed to cancel event. Please try again.");
  }
};

// Function to get participants for an event
export const getEventParticipants = async (eventId) => {
  try {
    const { eventData } = await validateEvent(eventId);
    return eventData.participants || [];
  } catch (error) {
    console.error("Error fetching participants:", error); // Debugging log
    return [];
  }
};

// Function to get participants' details (Only for the organizer)
export const getEventParticipantsDetails = async (eventId) => {
  try {
    const user = checkAuth();
    const { eventData } = await validateEvent(eventId);

    // Only the organizer can view detailed participants info
    if (eventData.userId !== user.uid) return [];

    const participantIds = eventData.participants || [];
    const participantDetails = await Promise.all(
      participantIds.map(async (participantId) => {
        const userRef = doc(db, "users", participantId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          return {
            id: participantId,
            email: userData.email || "Unknown Email",
            username: userData.displayName || "Unknown User",
          };
        }
        return { id: participantId, email: "Unknown Email", username: "Unknown User" };
      })
    );

    return participantDetails;
  } catch (error) {
    console.error("Error fetching participant details:", error); // Debugging log
    return [];
  }
};