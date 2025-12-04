'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default function EventMap({ events = [] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

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

  // Initialize map and markers
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.mapboxgl) return;

    window.mapboxgl.accessToken = MAPBOX_TOKEN;

    // Calculate center from events or default to SF
    let center = [-122.4194, 37.7749];
    if (events.length > 0) {
      const avgLng =
        events.reduce((sum, e) => sum + e.longitude, 0) / events.length;
      const avgLat =
        events.reduce((sum, e) => sum + e.latitude, 0) / events.length;
      center = [avgLng, avgLat];
    }

    const map = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center,
      zoom: events.length > 0 ? 10 : 11,
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before adding markers
    map.on('load', () => {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add markers for each event
      events.forEach((event) => {
        const isPast = new Date(event.eventTime).getTime() < Date.now();

        // Create wrapper for stable hover area
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        `;

        // Create the visible marker element
        const el = document.createElement('div');
        el.className = 'event-marker';
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background: ${isPast ? '#78716c' : '#059669'};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
        `;
        el.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
          </svg>
        `;

        wrapper.appendChild(el);

        // Hover events on wrapper so marker stays stable
        wrapper.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.15)';
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        });
        wrapper.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        });
        wrapper.addEventListener('click', () => {
          setSelectedEvent(event);
          map.flyTo({
            center: [event.longitude, event.latitude],
            zoom: 14,
          });
        });

        const marker = new window.mapboxgl.Marker({ element: wrapper })
          .setLngLat([event.longitude, event.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Fit bounds if multiple events
      if (events.length > 1) {
        const bounds = new window.mapboxgl.LngLatBounds();
        events.forEach((event) => {
          bounds.extend([event.longitude, event.latitude]);
        });
        map.fitBounds(bounds, { padding: 60 });
      }
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [mapLoaded, events]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-96 items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="mb-4 text-4xl">🗺️</div>
          <p className="text-emerald-700 font-medium">Mapbox not configured</p>
          <p className="mt-1 text-sm text-emerald-500">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="h-[500px] w-full"
        style={{ minHeight: '500px' }}
      />

      {/* Selected Event Panel */}
      {selectedEvent && (
        <div className="absolute bottom-4 left-4 right-4 z-10 md:left-auto md:right-4 md:w-96">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-emerald-900">
                    {selectedEvent.title}
                  </h3>
                  {new Date(selectedEvent.eventTime).getTime() < Date.now() && (
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600">
                      Past
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-emerald-600">
                  {timeFormatter.format(new Date(selectedEvent.eventTime))}
                </p>
                <p className="mt-1 text-sm text-emerald-600">
                  📍 {selectedEvent.location || 'Location TBA'}
                </p>
                {selectedEvent.creatorName && (
                  <p className="mt-1 text-xs text-emerald-500">
                    Hosted by {selectedEvent.creatorName}
                  </p>
                )}
                {selectedEvent.rsvpCount > 0 && (
                  <p className="mt-1 text-xs text-emerald-500">
                    {selectedEvent.rsvpCount}{' '}
                    {selectedEvent.rsvpCount === 1 ? 'person' : 'people'}{' '}
                    {new Date(selectedEvent.eventTime).getTime() < Date.now()
                      ? 'attended'
                      : 'going'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="ml-2 rounded-full p-1 text-emerald-400 transition hover:bg-emerald-50 hover:text-emerald-700"
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
            </div>
            {selectedEvent.description && (
              <p className="mt-3 text-sm text-emerald-700 line-clamp-2">
                {selectedEvent.description}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <Link
                href="/events"
                className="flex-1 rounded-full bg-emerald-100 px-4 py-2 text-center text-sm font-medium text-emerald-800 transition hover:bg-emerald-200"
              >
                View in feed
              </Link>
              {selectedEvent.groupName && (
                <Link
                  href={`/groups?view=${selectedEvent.groupId}`}
                  className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  View group
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state overlay */}
      {events.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-4 text-5xl">📍</div>
            <h3 className="text-xl font-semibold text-emerald-900">
              No events on the map yet
            </h3>
            <p className="mt-2 text-sm text-emerald-600">
              Create an event with a location to see it here!
            </p>
            <Link
              href="/events"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
            >
              Create event
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
