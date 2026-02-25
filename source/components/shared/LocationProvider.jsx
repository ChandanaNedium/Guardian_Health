import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

// Default city centers
const CITY_CENTERS = {
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
};

export function useLocation() {
  return useContext(LocationContext);
}

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateETA(distanceKm) {
  // Average speed in city ~25 km/h for ambulance with traffic
  const avgSpeed = 30;
  return Math.round((distanceKm / avgSpeed) * 60);
}

export { CITY_CENTERS };

export default function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualCity, setManualCity] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoading(false);
        },
        (err) => {
          setLocationError(err.message);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError('Geolocation not supported');
      setLoading(false);
    }
  }, []);

  const setManualLocation = (city) => {
    setManualCity(city);
    if (CITY_CENTERS[city]) {
      setLocation(CITY_CENTERS[city]);
      setLocationError(null);
    }
  };

  return (
    <LocationContext.Provider value={{ location, locationError, loading, manualCity, setManualLocation, CITY_CENTERS }}>
      {children}
    </LocationContext.Provider>
  );
}
