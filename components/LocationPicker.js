import React, { useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Map Click Handler Component
function MapClickHandler({ onMapClick }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (!map) return;
    
    map.on('click', onMapClick);
    
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

// Map Center Updater Component
function MapCenterUpdater({ center }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (map) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  // State management
  const [position, setPosition] = useState(
    initialLocation 
      ? [initialLocation.lat, initialLocation.lng] 
      : [51.505, -0.09] // Default: London
  );
  const [mapCenter, setMapCenter] = useState(
    initialLocation 
      ? [initialLocation.lat, initialLocation.lng] 
      : [51.505, -0.09]
  );
  const [address, setAddress] = useState(
    initialLocation ? initialLocation.address : ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const mapRef = useRef(null);

  // Geocoding functions that use Nominatim API directly
  const geocodeAddress = useCallback(async (query) => {
    if (!query.trim()) return [];
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { 
          headers: { 
            'Accept-Language': 'en',
            'User-Agent': 'EventEase Application (your-email@example.com)'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error("Geocoding error:", err);
      throw err;
    }
  }, []);

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { 
          headers: { 
            'Accept-Language': 'en',
            'User-Agent': 'EventEase Application (your-email@example.com)'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      throw err;
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback((e) => {
    const { lat, lng } = e.latlng;
    setPosition([lat, lng]);
    updateLocationFromCoordinates(lat, lng);
  }, []);

  // Update location data after getting coordinates
  const updateLocationFromCoordinates = useCallback(async (lat, lng) => {
    setIsSearching(true);
    setErrorMessage("");
    
    try {
      const result = await reverseGeocode(lat, lng);
      
      if (result && result.display_name) {
        setAddress(result.display_name);
        onLocationSelect({
          lat,
          lng,
          address: result.display_name
        });
      } else {
        // Fallback to coordinates if no address found
        const fallbackAddress = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddress(fallbackAddress);
        onLocationSelect({
          lat,
          lng,
          address: fallbackAddress
        });
      }
    } catch (err) {
      console.error("Failed to get address:", err);
      const fallbackAddress = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fallbackAddress);
      onLocationSelect({
        lat,
        lng,
        address: fallbackAddress
      });
      setErrorMessage("Could not retrieve address for this location.");
    } finally {
      setIsSearching(false);
    }
  }, [onLocationSelect, reverseGeocode]);

  // Handle search with debounce
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
  
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
  
    // Set new timeout for debounced search (2000ms delay)
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setErrorMessage("");
  
      try {
        const results = await geocodeAddress(query);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        setErrorMessage("Search failed. Please try again.");
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 2000); // 2000ms = 2 seconds
  }, [geocodeAddress]);

  // Handle search result selection
  const handleResultSelect = useCallback((result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setAddress(result.display_name);
    setSearchQuery(result.display_name);
    setShowDropdown(false);
    
    onLocationSelect({
      lat,
      lng,
      address: result.display_name
    });
  }, [onLocationSelect]);

  // Handle search form submission
  const handleSearchSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setErrorMessage("");
    
    try {
      const results = await geocodeAddress(searchQuery);
      
      if (results.length > 0) {
        // Automatically select the first result
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setPosition([lat, lng]);
        setMapCenter([lat, lng]);
        setAddress(result.display_name);
        
        onLocationSelect({
          lat,
          lng,
          address: result.display_name
        });
      } else {
        setErrorMessage("No locations found. Please try a different search.");
      }
    } catch (err) {
      setErrorMessage("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
      setShowDropdown(false);
    }
  }, [searchQuery, geocodeAddress, onLocationSelect]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }
    
    setIsSearching(true);
    setErrorMessage("");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        setPosition([lat, lng]);
        setMapCenter([lat, lng]);
        
        // Get address for the location
        updateLocationFromCoordinates(lat, lng);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setErrorMessage("Could not get your current location. Please try again or search for a location.");
        setIsSearching(false);
      }
    );
  }, [updateLocationFromCoordinates]);

  // CSS Styles
  const styles = {
    container: {
      width: "100%",
    },
    searchContainer: {
      position: "relative",
      marginBottom: "12px",
    },
    searchForm: {
      display: "flex",
      width: "100%",
    },
    input: {
      flex: 1,
      padding: "10px",
      borderRadius: "4px 0 0 4px",
      border: "1px solid #ccc",
      borderRight: "none",
      fontSize: "14px",
    },
    searchButton: {
      padding: "10px 16px",
      backgroundColor: "#4285f4",
      color: "white",
      border: "none",
      borderRadius: "0 4px 4px 0",
      cursor: "pointer",
      fontWeight: "bold",
    },
    locationButton: {
      padding: "10px",
      backgroundColor: "#f0f0f0",
      border: "1px solid #ccc",
      borderRadius: "4px",
      marginLeft: "8px",
      cursor: "pointer",
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      backgroundColor: "white",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      borderRadius: "4px",
      zIndex: 1000,
      maxHeight: "200px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "10px",
      borderBottom: "1px solid #eee",
      cursor: "pointer",
    },
    mapContainer: {
      height: "400px",
      width: "100%",
      border: "1px solid #ccc",
      borderRadius: "4px",
      overflow: "hidden",
    },
    loadingIndicator: {
      padding: "10px",
      backgroundColor: "#f8f9fa",
      borderRadius: "4px",
      marginBottom: "10px",
      textAlign: "center",
    },
    error: {
      padding: "10px",
      backgroundColor: "#f8d7da",
      color: "#721c24",
      borderRadius: "4px",
      marginBottom: "10px",
    },
    addressDisplay: {
      marginTop: "12px",
      padding: "12px",
      backgroundColor: "#f8f9fa",
      borderRadius: "4px",
      fontSize: "14px",
      border: "1px solid #e9ecef",
    },
  };

  return (
    <div style={styles.container}>
      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={isSearching}
            style={styles.input}
            autoComplete="off"
          />
          <button 
            type="submit" 
            disabled={isSearching || !searchQuery.trim()}
            style={{
              ...styles.searchButton,
              backgroundColor: isSearching || !searchQuery.trim() ? "#9fc1f9" : "#4285f4"
            }}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          <button 
            type="button" 
            onClick={getCurrentLocation} 
            disabled={isSearching}
            style={styles.locationButton}
            title="Use your current location"
          >
            📍
          </button>
        </form>
        
        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div style={styles.dropdown}>
            {searchResults.map((result, index) => (
              <div 
                key={`${result.place_id || index}`}
                style={styles.dropdownItem}
                onClick={() => handleResultSelect(result)}
              >
                {result.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {errorMessage && <div style={styles.error}>{errorMessage}</div>}
      
      {/* Loading Indicator */}
      {isSearching && (
        <div style={styles.loadingIndicator}>
          Loading location data...
        </div>
      )}
      
      {/* Map */}
      <div style={styles.mapContainer}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position}>
            <Popup>{address || "Selected location"}</Popup>
          </Marker>
          <MapClickHandler onMapClick={handleMapClick} />
          <MapCenterUpdater center={mapCenter} />
        </MapContainer>
      </div>
      
      {/* Selected Location Display */}
      {address && (
        <div style={styles.addressDisplay}>
          <strong>Selected Location:</strong> {address}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;