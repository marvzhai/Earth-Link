'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import EventModal from './EventModal';
import EventList from './EventList';

const FILTERS = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'All', value: 'all' },
];

export default function EventsPage({
  initialEvents = [],
  currentUser,
  groups = [],
}) {
  const [events, setEvents] = useState(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const router = useRouter();

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const handleEventCreated = (ev) => {
    setEvents((prev) => [ev, ...prev]);
  };

  const handleEventDeleted = (id) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const handleEventUpdated = (updatedEvent) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    );
  };

  const handleCreateClick = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    const now = Date.now();
    if (filter === 'past') {
      return events.filter(
        (event) => new Date(event.eventTime).getTime() < now
      );
    }
    return events.filter((event) => new Date(event.eventTime).getTime() >= now);
  }, [events, filter]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-500">
            Plan together
          </p>
          <h2 className="text-2xl font-semibold text-emerald-900">
            Events & gatherings
          </h2>
          <p className="text-sm text-emerald-600">
            Host cleanups, nature walks, or study sessions with the community.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
        >
          Create event
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === item.value
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {item.label}
          </button>
        ))}
        <span className="rounded-full border border-emerald-100 px-4 py-2 text-sm text-emerald-700">
          {filteredEvents.length} listed
        </span>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEventCreated={handleEventCreated}
        groups={groups}
      />

      <EventList
        events={filteredEvents}
        onEventDeleted={handleEventDeleted}
        onEventUpdated={handleEventUpdated}
        currentUser={currentUser}
      />
    </>
  );
}
