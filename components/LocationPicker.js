import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const [position, setPosition] = useState(initialLocation ? [initialLocation.lat, initialLocation.lng] : [51.505, -0.09]); // Default position (London)
  const [address, setAddress] = useState(initialLocation ? initialLocation.address : "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const provider = new OpenStreetMapProvider();

  // Debounce search to avoid excessive API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Handle map click to set marker position
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const results = await provider.search({ query: `${lat},${lng}` });
      if (results.length > 0) {
        setAddress(results[0].label);
        onLocationSelect({ lat, lng, address: results[0].label });
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setSearchError("Failed to fetch address. Please try again.");
    }
  };

  // Handle address search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchError("");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const results = await provider.search({ query });
      if (results.length > 0) {
        const { x: lng, y: lat, label } = results[0];
        setPosition([lat, lng]);
        setAddress(label);
        onLocationSelect({ lat, lng, address: label });
      } else {
        setSearchError("No results found. Please try a different query.");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError("Failed to fetch results. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search handler
  const debouncedSearch = debounce(handleSearch, 500);

  // Handle search input change
  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  return (
    <div>
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search for a location..."
        value={searchQuery}
        onChange={handleInputChange}
        style={{ width: "100%", marginBottom: "10px" }}
        disabled={isSearching}
      />
      {isSearching && <p>Searching...</p>}
      {searchError && <p style={{ color: "red" }}>{searchError}</p>}

      {/* Map */}
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "400px", width: "100%" }}
        onClick={handleMapClick}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>{address}</Popup>
        </Marker>
      </MapContainer>

      {/* Display Selected Location */}
      {address && (
        <p>
          Selected Location: {address} (Lat: {position[0]}, Lng: {position[1]})
        </p>
      )}
    </div>
  );
};

export default LocationPicker;