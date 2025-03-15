// utils/filterEvents.js
export const filterEvents = (events, search = "", selectedCategory = "") => {
  return events.filter((event) => {
    // Normalize search term and event title for case-insensitive comparison
    const normalizedSearch = search.toLowerCase();
    const normalizedTitle = event.title?.toLowerCase() || "";

    // Check if the event matches the selected category (if any)
    const matchesCategory = selectedCategory
      ? event.category === selectedCategory
      : true;

    // Check if the event title includes the search term (if any)
    const matchesSearch = normalizedTitle.includes(normalizedSearch);

    // Return true only if both conditions are met
    return matchesCategory && matchesSearch;
  });
};