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
      const user = auth.currentUser;
      const eventsSnapshot = await getDocs(collection(db, "events"));
  
      const eventsList = eventsSnapshot.docs.map((doc) => {
        const data = doc.data();
        if (user?.uid !== data.userId) delete data.participants; // Hide participants for non-organizers
        return { id: doc.id, ...data };
      });
  
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
      if (eventData.participants?.includes(user.uid)) throw new Error("User already joined this event");
  
      await updateDoc(eventRef, { participants: arrayUnion(user.uid) });
  
      console.log("User joined event successfully");
      return { success: true, message: "Successfully joined the event." };
    } catch (error) {
      console.error("Error joining event:", error);
      throw new Error("Error joining event");
    }
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
      if (eventData.userId !== user.uid) throw new Error("Not authorized to view participants");
  
      const participantIds = eventData.participants || [];
  
      // Fetch all participant emails in parallel
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
      throw new Error("Error fetching participants");
    }
  };