'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function LocationPicker({
  initialLocation = '',
  initialLat = null,
  initialLng = null,
  onLocationChange,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialLocation);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    name: initialLocation,
    lat: initialLat,
    lng: initialLng,
  });

  // Load Mapbox GL JS
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token not found');
      return;
    }

    // Load CSS
    if (!document.getElementById('mapbox-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-css';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
      document.head.appendChild(link);
    }

    // Load JS
    if (!window.mapboxgl) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map when shown
  useEffect(() => {
    if (!showMap || !mapLoaded || !mapContainerRef.current || !window.mapboxgl)
      return;
    if (mapRef.current) return; // Already initialized

    window.mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [
        selectedLocation.lng || initialLng || -122.4194,
        selectedLocation.lat || initialLat || 37.7749,
      ],
      zoom: 12,
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

    // Add marker if location exists
    if (selectedLocation.lat && selectedLocation.lng) {
      const marker = new window.mapboxgl.Marker({ color: '#059669' })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(map);
      markerRef.current = marker;
    }

    // Click to place marker
    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;

      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const marker = new window.mapboxgl.Marker({ color: '#059669' })
          .setLngLat([lng, lat])
          .addTo(map);
        markerRef.current = marker;
      }

      // Reverse geocode to get place name
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();
        const placeName =
          data.features?.[0]?.place_name ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        setSelectedLocation({ name: placeName, lat, lng });
        setSearchQuery(placeName);
        onLocationChange?.({ name: placeName, lat, lng });
      } catch {
        const placeName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setSelectedLocation({ name: placeName, lat, lng });
        setSearchQuery(placeName);
        onLocationChange?.({ name: placeName, lat, lng });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [
    showMap,
    mapLoaded,
    initialLat,
    initialLng,
    onLocationChange,
    selectedLocation.lat,
    selectedLocation.lng,
  ]);

  // Search for locations
  const searchLocations = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== selectedLocation.name) {
        searchLocations(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations, selectedLocation.name]);

  // Select a suggestion
  const selectSuggestion = (feature) => {
    const [lng, lat] = feature.center;
    const name = feature.place_name;

    setSearchQuery(name);
    setSuggestions([]);
    setSelectedLocation({ name, lat, lng });
    onLocationChange?.({ name, lat, lng });

    // Update map and marker if map is visible
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const marker = new window.mapboxgl.Marker({ color: '#059669' })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
        markerRef.current = marker;
      }
    }
  };

  // Clear location
  const clearLocation = () => {
    setSearchQuery('');
    setSuggestions([]);
    setSelectedLocation({ name: '', lat: null, lng: null });
    onLocationChange?.({ name: '', lat: null, lng: null });

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium">Mapbox not configured</p>
        <p className="mt-1 text-xs">
          Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter address, city, or place name..."
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 py-3 pl-11 pr-10 text-emerald-900 placeholder:text-emerald-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="h-5 w-5 animate-spin text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>
          {selectedLocation.lat && (
            <button
              type="button"
              onClick={clearLocation}
              className="rounded-full p-2.5 text-emerald-500 transition hover:bg-emerald-100 hover:text-emerald-700"
              title="Clear location"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-20 mt-2 w-full rounded-2xl border border-emerald-100 bg-white shadow-xl">
            {suggestions.map((feature, index) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => selectSuggestion(feature)}
                className={`w-full px-4 py-3 text-left text-sm text-emerald-900 transition hover:bg-emerald-50 ${
                  index === 0 ? 'rounded-t-2xl' : ''
                } ${index === suggestions.length - 1 ? 'rounded-b-2xl' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="line-clamp-2">{feature.place_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected location display */}
      {selectedLocation.lat && selectedLocation.lng && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2.5 text-sm text-emerald-800">
          <svg
            className="h-4 w-4 flex-shrink-0 text-emerald-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate font-medium">{selectedLocation.name}</span>
        </div>
      )}

      {/* Toggle Map Button */}
      <button
        type="button"
        onClick={() => setShowMap(!showMap)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-2.5 text-sm text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        {showMap ? 'Hide map' : 'Pick on map'}
        <svg
          className={`h-4 w-4 transition-transform ${
            showMap ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Map Container - Collapsible */}
      {showMap && (
        <div
          ref={mapContainerRef}
          className="h-56 w-full overflow-hidden rounded-2xl border border-emerald-100"
          style={{ minHeight: '224px' }}
        />
      )}

      {showMap && (
        <p className="text-xs text-emerald-500">
          Click anywhere on the map to set the exact location.
        </p>
      )}
    </div>
  );
}
