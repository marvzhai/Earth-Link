'use client';

import { useMemo, useState } from 'react';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

function formatDateTime(value) {
  const date = new Date(value);
  return `${date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })} · ${timeFormatter.format(date)}`;
}

export default function EventList({
  events = [],
  onEventDeleted,
  currentUser,
}) {
  const [deletingId, setDeletingId] = useState(null);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
      ),
    [events]
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      onEventDeleted?.(id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!sortedEvents.length) {
    return (
      <div className="py-16 text-center">
        <div className="mb-6 text-6xl">🍃</div>
        <h3 className="mb-3 text-2xl font-semibold text-emerald-900">
          No events yet
        </h3>
        <p className="mx-auto max-w-md text-emerald-600">
          Start the first gathering—host a cleanup, workshop, or walk to bring
          Earth Link neighbors together.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sortedEvents.map((event) => {
        const eventDate = new Date(event.eventTime);
        const month = monthFormatter.format(eventDate);
        const day = eventDate.getDate();

        return (
          <article
            key={event.id}
            className="rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-sm transition hover:border-emerald-200"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700">
                  <span className="text-xs uppercase tracking-wide">
                    {month}
                  </span>
                  <span className="text-2xl font-semibold text-emerald-900">
                    {day}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-emerald-900">
                    {event.title}
                  </h4>
                  <p className="text-sm text-emerald-600">
                    Hosted by{' '}
                    {event.creatorName
                      ? `${event.creatorName} · @${event.creatorHandle}`
                      : 'Community'}
                  </p>
                </div>
              </div>

              {currentUser?.id === event.creatorId && (
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deletingId === event.id}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-60"
                >
                  {deletingId === event.id ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
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
                      Deleting
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Remove
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 text-sm text-emerald-700 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatDateTime(event.eventTime)}
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 12.414A4 4 0 1012 13l4.243 4.243a1 1 0 001.414-1.414z"
                  />
                </svg>
                {event.location || 'Location TBA'}
              </div>
            </div>

            {event.description && (
              <p className="mt-4 text-sm leading-relaxed text-emerald-900 whitespace-pre-wrap">
                {event.description}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
