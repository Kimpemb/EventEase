import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

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
