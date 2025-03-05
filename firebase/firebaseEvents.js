import { collection, addDoc, getDocs, doc, updateDoc, arrayUnion, getDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebaseConfig"; // Import auth to get the current user

// Function to create an event in Firestore
export const createEvent = async (eventData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const docRef = await addDoc(collection(db, "events"), {
      ...eventData,
      userId: user.uid, // Store user ID
      username: user.displayName || "Anonymous", // Store username (fallback to "Anonymous")
      category: eventData.category || "Uncategorized", // Store category with default fallback
      participants: [], // Initialize participants list
      createdAt: serverTimestamp(), // Add server-side timestamp
    });

    console.log("Event created with ID:", docRef.id);
    return docRef.id; // Return event ID for further usage
  } catch (error) {
    console.error("Error adding event:", error);
    throw new Error("Error creating event");
  }
};

// Function to get all events from Firestore
export const getEvents = async () => {
  try {
    const eventsSnapshot = await getDocs(collection(db, "events"));
    const eventsList = eventsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return eventsList;
  } catch (e) {
    console.error("Error fetching events:", e);
    throw new Error("Error fetching events");
  }
};

// Function to join an event
export const joinEvent = async (eventId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      throw new Error("Event not found");
    }

    const eventData = eventSnap.data();
    if (eventData.participants?.includes(user.uid)) {
      throw new Error("User already joined this event");
    }

    await updateDoc(eventRef, {
      participants: arrayUnion(user.uid),
    });

    console.log("User joined event successfully");
    return { success: true, message: "Successfully joined the event." };
  } catch (error) {
    console.error("Error joining event:", error);
    throw new Error("Error joining event");
  }
};
