import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

// Function to create an event in Firestore
export const createEvent = async (eventData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const docRef = await addDoc(collection(db, "events"), {
      ...eventData,
      userId: user.uid,
      username: user.displayName || "Anonymous",
      category: eventData.category || "Uncategorized",
      participants: [],
      status: "Upcoming",
      createdAt: serverTimestamp(),
    });

    console.log("Event created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Error creating event");
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
        if (now >= eventEnd) {
          status = "Ended";
        } else if (now >= eventStart) {
          status = "Ongoing";
        }

        // Update Firestore if status has changed
        if (status !== data.status) {
          await updateEventStatus(docSnap.id, status);
        }

        return { id: docSnap.id, ...data, status };
      })
    );

    return eventsList;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error("Error fetching events");
  }
};

// Function to get events created by a specific organizer
export const getOrganizerEvents = async (organizerId) => {
  try {
    const q = query(collection(db, "events"), where("userId", "==", organizerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    throw new Error("Error fetching organizer events");
  }
};

// Function to get a single event by ID
export const getEventById = async (eventId) => {
  try {
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) throw new Error("Event not found");

    return { id: eventSnap.id, ...eventSnap.data() };
  } catch (error) {
    console.error("Error fetching event details:", error);
    throw new Error("Error fetching event details");
  }
};

// Function to join an event
export const joinEvent = async (eventId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) throw new Error("Event not found");

    const eventData = eventSnap.data();
    if (eventData.status !== "Upcoming") {
      throw new Error("Cannot join an event that has already started or ended.");
    }

    if (eventData.participants?.includes(user.uid)) {
      console.log("User already joined this event");
      return { success: false, message: "Already joined this event" };
    }

    await updateDoc(eventRef, { participants: arrayUnion(user.uid) });
    console.log("User joined event successfully");
    return { success: true, message: "Successfully joined the event." };
  } catch (error) {
    console.error("Error joining event:", error);
    return { success: false, message: "Error joining event" };
  }
};

// Function to update event status (Started, Ended, Canceled)
export const updateEventStatus = async (eventId, status) => {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, { status });
    console.log(`Event ${eventId} updated to ${status}`);
  } catch (error) {
    console.error("Error updating event status:", error);
  }
};

// Function to cancel an event
export const cancelEvent = async (eventId) => {
  return updateEventStatus(eventId, "canceled");
};

// Function to get participants' emails (Only for the organizer)
export const getEventParticipants = async (eventId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) throw new Error("Event not found");

    const eventData = eventSnap.data();
    if (eventData.userId !== user.uid) return []; // Not authorized to view

    const participantIds = eventData.participants || [];
    const participantEmails = await Promise.all(
      participantIds.map(async (participantId) => {
        const userRef = doc(db, "users", participantId);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? userSnap.data().email : "Unknown User";
      })
    );

    return participantEmails;
  } catch (error) {
    console.error("Error fetching participants:", error);
    return [];
  }
};
