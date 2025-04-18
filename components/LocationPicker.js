import React, { useState, useCallback, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "../styles/locationpicker.module.css";

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
  
  useEffect(() => {
    if (!map) return;
    
    map.on('click', onMapClick);
    
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

// Map Center Updater Component
function MapCenterUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, map, zoom]);
  
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
  const [mapZoom, setMapZoom] = useState(13);
  const [address, setAddress] = useState(
    initialLocation ? initialLocation.address : ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocationTip, setShowLocationTip] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isNetworkError, setIsNetworkError] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const mapRef = useRef(null);
  const apiRequestsCount = useRef(0);
  const lastRequestTime = useRef(0);
  const tooltipTimeoutRef = useRef(null);

  // Rate limiter for Nominatim API (max 1 request per second)
  const rateLimit = useCallback((fn) => {
    return async (...args) => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      
      // If less than 1.1 seconds since last request, add delay
      if (timeSinceLastRequest < 1100) {
        const delay = 1100 - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      lastRequestTime.current = Date.now();
      apiRequestsCount.current += 1;
      
      return fn(...args);
    };
  }, []);

  // Check for network connectivity
  const checkNetworkConnectivity = useCallback(() => {
    return navigator.onLine;
  }, []);

  // Enhanced fetch with network error handling
  const enhancedFetch = useCallback(async (url, options = {}) => {
    if (!checkNetworkConnectivity()) {
      setIsNetworkError(true);
      throw new Error("No internet connection. Please check your network and try again.");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setIsNetworkError(false);
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        setIsNetworkError(true);
        throw new Error("Request timed out. Please check your connection and try again.");
      }
      
      // Check if it's a network error
      if (!checkNetworkConnectivity() || error.message.includes('Failed to fetch')) {
        setIsNetworkError(true);
        throw new Error("Network error. Please check your connection and try again.");
      }
      
      throw error;
    }
  }, [checkNetworkConnectivity]);

  // Geocoding functions that use Nominatim API directly
  const geocodeAddress = useCallback(async (query) => {
    if (!query.trim()) return [];
    
    try {
      const response = await enhancedFetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { 
          headers: { 
            'Accept-Language': 'en',
            'User-Agent': 'EventEase Application (your-email@example.com)'
          }
        }
      );
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Geocoding error:", err);
      throw err;
    }
  }, [enhancedFetch]);

  const geocodeAddressWithRateLimit = useCallback(rateLimit(geocodeAddress), [geocodeAddress, rateLimit]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await enhancedFetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { 
          headers: { 
            'Accept-Language': 'en',
            'User-Agent': 'EventEase Application (your-email@example.com)'
          }
        }
      );
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      throw err;
    }
  }, [enhancedFetch]);

  const reverseGeocodeWithRateLimit = useCallback(rateLimit(reverseGeocode), [reverseGeocode, rateLimit]);

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
    setIsNetworkError(false);
    
    try {
      // Try to get a more precise address with a higher zoom level
      const result = await reverseGeocodeWithRateLimit(lat, lng);
      
      if (result && result.display_name) {
        // Success case - we got an address
        setAddress(result.display_name);
        
        // Use the exact coordinates from the geolocation API, not from Nominatim
        // This ensures the marker is exactly where the user is
        onLocationSelect({
          lat,
          lng,
          address: result.display_name
        });
        
        // Reset retry counter on success
        setRetryCount(0);
        setShowLocationTip(false);
      } else {
        // Fallback to coordinates if no address found
        const fallbackAddress = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddress(fallbackAddress);
        onLocationSelect({
          lat,
          lng,
          address: fallbackAddress
        });
        
        // Show tip if no address found
        setShowLocationTip(true);
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
      
      // Display network-specific error message
      if (err.message.includes('Network error') || err.message.includes('Failed to fetch') || err.message.includes('internet connection')) {
        setIsNetworkError(true);
        setErrorMessage("Network error: Could not retrieve address. Please check your connection and try again.");
      } else {
        setErrorMessage("Could not retrieve address for this location.");
      }
      
      // Show tip for potential retry
      setShowLocationTip(true);
    } finally {
      setIsSearching(false);
    }
  }, [onLocationSelect, reverseGeocodeWithRateLimit]);

  // Handle search with debounce (reduced to 800ms for better responsiveness)
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
  
    // Set new timeout for debounced search (800ms delay)
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setErrorMessage("");
      setIsNetworkError(false);
  
      try {
        const results = await geocodeAddressWithRateLimit(query);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
        
        // Hide location tip when search is used
        setShowLocationTip(false);
      } catch (err) {
        if (err.message.includes('Network error') || err.message.includes('Failed to fetch') || err.message.includes('internet connection')) {
          setIsNetworkError(true);
          setErrorMessage("Network error: Search failed. Please check your connection and try again.");
        } else {
          setErrorMessage("Search failed. Please try again.");
        }
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 800); // 800ms - more responsive than 2 seconds
  }, [geocodeAddressWithRateLimit]);

  // Handle search result selection
  const handleResultSelect = useCallback((result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setAddress(result.display_name);
    setSearchQuery(result.display_name);
    setShowDropdown(false);
    setMapZoom(15); // Zoom in when selecting a specific location
    
    onLocationSelect({
      lat,
      lng,
      address: result.display_name
    });
    
    // Hide location tip when a location is selected
    setShowLocationTip(false);
  }, [onLocationSelect]);

  // Handle search form submission
  const handleSearchSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setErrorMessage("");
    setIsNetworkError(false);
    
    try {
      const results = await geocodeAddressWithRateLimit(searchQuery);
      
      if (results.length > 0) {
        // Automatically select the first result
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setPosition([lat, lng]);
        setMapCenter([lat, lng]);
        setAddress(result.display_name);
        setMapZoom(15); // Zoom in when selecting a specific location
        
        onLocationSelect({
          lat,
          lng,
          address: result.display_name
        });
        
        // Hide location tip when search is used
        setShowLocationTip(false);
      } else {
        setErrorMessage("No locations found. Please try a different search.");
      }
    } catch (err) {
      if (err.message.includes('Network error') || err.message.includes('Failed to fetch') || err.message.includes('internet connection')) {
        setIsNetworkError(true);
        setErrorMessage("Network error: Search failed. Please check your connection and try again.");
      } else {
        setErrorMessage("Search failed. Please try again.");
      }
    } finally {
      setIsSearching(false);
      setShowDropdown(false);
    }
  }, [searchQuery, geocodeAddressWithRateLimit, onLocationSelect]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }
    
    // Check network connectivity first
    if (!checkNetworkConnectivity()) {
      setIsNetworkError(true);
      setErrorMessage("No internet connection. Please check your network before using location features.");
      return;
    }
    
    setIsSearching(true);
    setErrorMessage("");
    setIsNetworkError(false);
    
    // Increment retry counter
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    // Clear any cached positions first
    if (navigator.geolocation.clearWatch) {
      // This is a workaround to try to clear cached positions in Chrome
      const watchId = navigator.geolocation.watchPosition(() => {}, () => {});
      navigator.geolocation.clearWatch(watchId);
    }
    
    // Force Chrome to use high accuracy and avoid caching
    const options = {
      enableHighAccuracy: true,
      timeout: 20000,       // Increased timeout for Chrome
      maximumAge: 0,        // Don't use cached positions
      forceRequest: true    // Non-standard option that some browsers might support
    };
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        
        console.log(`Browser: ${navigator.userAgent}`);
        console.log(`Got position with accuracy: ${accuracy} meters`);
        console.log(`Coordinates: ${lat}, ${lng}`);
        console.log(`Timestamp: ${new Date(position.timestamp).toISOString()}`);
        console.log(`Attempt number: ${newRetryCount}`);
        
        // Check if this is a fresh position
        const positionAge = Date.now() - position.timestamp;
        console.log(`Position age: ${positionAge} ms`);
        
        setPosition([lat, lng]);
        setMapCenter([lat, lng]);
        
        // Adjust zoom based on accuracy
        const zoomLevel = accuracy <= 100 ? 16 : accuracy <= 500 ? 15 : 14;
        setMapZoom(zoomLevel);
        
        // If accuracy is poor, show the location tip
        if (accuracy > 500 || positionAge > 60000) {
          setShowLocationTip(true);
          
          // If this tooltip is shown, automatically hide it after 10 seconds
          if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
          }
          tooltipTimeoutRef.current = setTimeout(() => {
            setShowLocationTip(false);
          }, 10000);
        } else {
          setShowLocationTip(false);
        }
        
        // Get address for the location
        updateLocationFromCoordinates(lat, lng);
      },
      (err) => {
        console.error("Geolocation error:", err);
        let errorMsg = "Could not get your current location.";
        
        switch(err.code) {
          case 1:
            errorMsg = "Location access was denied. Please enable location services and try again.";
            break;
          case 2:
            errorMsg = "Location unavailable. Please try again or search for a location.";
            break;
          case 3:
            errorMsg = "Location request timed out. Please try again or search for a location.";
            break;
        }
        
        // Add browser-specific suggestions
        const isChrome = navigator.userAgent.indexOf("Chrome") > -1;
        if (isChrome) {
          errorMsg += " For Chrome, please check your location settings at chrome://settings/content/location";
        }
        
        setErrorMessage(errorMsg);
        setIsSearching(false);
        setShowLocationTip(true); // Show tip on error
      },
      options
    );
  }, [updateLocationFromCoordinates, retryCount, checkNetworkConnectivity]);

  // Handle click outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (showDropdown && !event.target.closest(`.${styles.searchContainer}`)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Network status listener
  useEffect(() => {
    const handleOnline = () => {
      if (isNetworkError) {
        setIsNetworkError(false);
        setErrorMessage(prev => prev.includes("Network error") ? "" : prev);
      }
    };
    
    const handleOffline = () => {
      setIsNetworkError(true);
      setErrorMessage("You are currently offline. Please check your internet connection.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isNetworkError]);

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={isSearching}
            className={styles.input}
            autoComplete="off"
          />
          <button 
            type="submit" 
            disabled={isSearching || !searchQuery.trim()}
            className={`${styles.searchButton} ${(isSearching || !searchQuery.trim()) ? styles.disabled : ''}`}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          <div className={styles.locationButtonContainer}>
            <button 
              type="button" 
              onClick={getCurrentLocation} 
              disabled={isSearching}
              className={styles.locationButton}
              title="Use your current location"
            >
              📍
            </button>
            {retryCount > 0 && (
              <div className={styles.retryBadge}>{retryCount}</div>
            )}
          </div>
        </form>
        
        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className={styles.dropdown}>
            {searchResults.map((result, index) => (
              <div 
                key={`${result.place_id || index}`}
                className={styles.dropdownItem}
                onClick={() => handleResultSelect(result)}
              >
                {result.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {errorMessage && (
        <div className={`${styles.error} ${isNetworkError ? styles.networkError : ''}`}>
          {errorMessage}
        </div>
      )}
      
      {/* Location Tip */}
      {showLocationTip && (
        <div className={styles.locationTip}>
          <span className={styles.tipIcon}>💡</span>
          {retryCount > 0 ? (
            <span>
              Location may not be accurate. Try clicking the location button 
              <button 
                className={styles.inlineTipButton} 
                onClick={getCurrentLocation} 
                disabled={isSearching}
              >
                📍
              </button> 
              again for better accuracy, or use the search bar if you know your location.
            </span>
          ) : (
            <span>
              If the selected location isn't accurate, try clicking the location button again or search for your location manually.
            </span>
          )}
          <button 
            className={styles.closeTipButton}
            onClick={() => setShowLocationTip(false)}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Loading Indicator */}
      {isSearching && (
        <div className={styles.loadingIndicator}>
          Loading location data...
        </div>
      )}
      
      {/* Network Error Recovery */}
      {isNetworkError && !isSearching && (
        <div className={styles.networkRetryContainer}>
          <button 
            className={styles.networkRetryButton}
            onClick={() => {
              if (checkNetworkConnectivity()) {
                if (position && position.length === 2) {
                  updateLocationFromCoordinates(position[0], position[1]);
                } else if (searchQuery.trim()) {
                  handleSearchSubmit({ preventDefault: () => {} });
                }
              } else {
                setErrorMessage("Still offline. Please check your internet connection and try again.");
              }
            }}
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Map */}
      <div className={styles.mapContainer}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className={styles.map}
          ref={mapRef}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position}>
            <Popup>{address || "Selected location"}</Popup>
          </Marker>
          <MapClickHandler onMapClick={handleMapClick} />
          <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
        </MapContainer>
      </div>
      
      {/* Selected Location Display */}
      {address && (
        <div className={styles.addressDisplay}>
          <strong>Selected Location:</strong> {address}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;