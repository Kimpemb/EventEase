import React, { useEffect, useState } from "react";
import { getEvents, joinEvent, leaveEvent, getEventParticipants, updateEvent, cancelEvent } from "../firebase/firebaseEvents";
import { auth } from "../firebase/firebaseConfig";
import { notifyOrganizer } from "../firebase/notificationAPI";
import styles from "../styles/Events.module.css";
import LocationPicker from "../components/LocationPicker"; // Updated import path

const categories = [
  "General", "Music", "Sports", "Tech", "Education", "Health", "Business", "Art", "Entertainment"
];

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: null,
    category: ""
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventsList = await getEvents();
      const updatedEvents = await Promise.all(
        eventsList.map(async (event) => {
          try {
            const participantEmails = await getEventParticipants(event.id);
            return { ...event, participantEmails };
          } catch (participantError) {
            console.error("Error fetching participants:", participantError);
            return { ...event, participantEmails: [] };
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

  const handleJoinEvent = async (event) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to join an event.");
      return;
    }
    if (event.status === "Ended" || event.status === "Cancelled") {
      alert("You cannot join this event.");
      return;
    }
    if (event.participants?.includes(user.uid)) {
      alert("You have already joined this event.");
      return;
    }

    try {
      await joinEvent(event.id);
      alert("You have successfully joined the event!");

      // Notify the organizer
      const participantName = user.displayName || user.email;
      await notifyOrganizer(event.userId, event.id, participantName, "joined");

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === event.id
            ? { ...e, participants: [...(e.participants || []), user.uid] }
            : e
        )
      );
    } catch (err) {
      console.error("Error joining event:", err);
      alert(err.message || "Failed to join event. Please try again later.");
    }
  };

  const handleLeaveEvent = async (event) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to leave an event.");
      return;
    }
    if (event.status === "Ended" || event.status === "Cancelled") {
      alert("You cannot leave this event.");
      return;
    }
    if (!event.participants?.includes(user.uid)) {
      alert("You are not a participant of this event.");
      return;
    }

    try {
      await leaveEvent(event.id);
      alert("You have successfully left the event!");

      // Notify the organizer
      const participantName = user.displayName || user.email;
      await notifyOrganizer(event.userId, event.id, participantName, "left");

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === event.id
            ? { ...e, participants: e.participants?.filter((id) => id !== user.uid) }
            : e
        )
      );
    } catch (err) {
      console.error("Error leaving event:", err);
      alert(err.message || "Failed to leave event. Please try again later.");
    }
  };

  const startEditingEvent = (event) => {
    setEditingEvent(event.id);
    setUpdateFormData({
      title: event.title || "",
      description: event.description || "",
      date: event.date || "",
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      location: event.location || null,
      category: event.category || "General"
    });
  };

  const cancelEditing = () => {
    setEditingEvent(null);
    setUpdateFormData({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      location: null,
      category: ""
    });
  };

  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (location) => {
    setUpdateFormData(prev => ({
      ...prev,
      location
    }));
  };

  const handleUpdateEvent = async (eventId) => {
    try {
      await updateEvent(eventId, updateFormData);
      alert("Event updated successfully!");
      // Reset editing state
      setEditingEvent(null);
      // Refresh events list
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event. Please try again.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
      try {
        await cancelEvent(eventId);
        alert("Event canceled successfully!");
        // Refresh events list
        fetchEvents();
      } catch (error) {
        console.error("Error canceling event:", error);
        alert("Failed to cancel event. Please try again.");
      }
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory ? event.category === selectedCategory : true;
    const matchesSearch = search ? 
      event.title?.toLowerCase().includes(search.toLowerCase()) || 
      event.description?.toLowerCase().includes(search.toLowerCase()) : 
      true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Discover Events</h1>
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.select}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className={styles.loading}>Loading events...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <div className={styles.eventsContainer}>
          {filteredEvents.length === 0 ? (
            <p className={styles.noEvents}>No events found. Try adjusting your filters or create a new event!</p>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                {editingEvent === event.id ? (
                  <div className={styles.editForm}>
                    <h3 className={styles.editTitle}>Edit Event</h3>
                    <div className={styles.formGroup}>
                      <label>Title</label>
                      <input
                        type="text"
                        name="title"
                        value={updateFormData.title}
                        onChange={handleUpdateFormChange}
                        className={styles.input}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={updateFormData.description}
                        onChange={handleUpdateFormChange}
                        className={styles.textarea}
                        rows="3"
                        required
                      />
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Date</label>
                        <input
                          type="date"
                          name="date"
                          value={updateFormData.date}
                          onChange={handleUpdateFormChange}
                          className={styles.input}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Start Time</label>
                        <input
                          type="time"
                          name="startTime"
                          value={updateFormData.startTime}
                          onChange={handleUpdateFormChange}
                          className={styles.input}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>End Time</label>
                        <input
                          type="time"
                          name="endTime"
                          value={updateFormData.endTime}
                          onChange={handleUpdateFormChange}
                          className={styles.input}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <LocationPicker 
                        onLocationSelect={handleLocationSelect} 
                        initialLocation={updateFormData.location}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Category</label>
                      <select
                        name="category"
                        value={updateFormData.category}
                        onChange={handleUpdateFormChange}
                        className={styles.select}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.buttonContainer}>
                      <button 
                        className={styles.updateButton}
                        onClick={() => handleUpdateEvent(event.id)}
                      >
                        Save Changes
                      </button>
                      <button 
                        className={styles.cancelButton}
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.categoryBadge}>{event.category || "General"}</div>
                    <h2 className={styles.eventTitle}>{event.title}</h2>
                    <p className={styles.eventDescription}>{event.description}</p>
                    <div className={styles.eventDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailIcon}>📅</span>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailIcon}>⏰</span>
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailIcon}>📍</span>
                        <span>{event.location?.address || "Location not specified"}</span> {/* Fixed */}
                      </div>
                    </div>
                    <div className={styles.organizerInfo}>
                      <p>Organized by: {event.organizer || "Unknown"}</p>
                      <p className={styles.statusBadge} data-status={event.status || "Upcoming"}>
                        {event.status || "Upcoming"}
                      </p>
                    </div>
                    <div className={styles.participantInfo}>
                      <p>Participants: {event.participants?.length || 0}</p>
                    </div>
                    
                    {auth.currentUser && auth.currentUser.uid !== event.userId && event.status === "Upcoming" && (
                      <div className={styles.buttonContainer}>
                        {event.participants?.includes(auth.currentUser?.uid) ? (
                          <button
                            onClick={() => handleLeaveEvent(event)}
                            className={styles.leaveButton}
                          >
                            Leave Event
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinEvent(event)}
                            className={styles.joinButton}
                          >
                            Join Event
                          </button>
                        )}
                      </div>
                    )}
                    
                    {auth.currentUser && auth.currentUser.uid === event.userId && (
                      <div className={styles.buttonContainer}>
                        <button
                          onClick={() => startEditingEvent(event)}
                          className={styles.editButton}
                        >
                          Edit Event
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className={styles.deleteButton}
                        >
                          Cancel Event
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;