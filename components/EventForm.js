// firebase/firebaseAuth.js
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "./firebaseConfig"; // Ensure you import your firebase app config

const db = getFirestore(app);

export const createEvent = async (eventDetails) => {
  try {
    const eventRef = collection(db, "events");
    await addDoc(eventRef, eventDetails);
  } catch (err) {
    throw new Error("Error creating event: " + err.message);
  }
};
