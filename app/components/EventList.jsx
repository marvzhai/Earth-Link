'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import EventDetailModal from './EventDetailModal';

const MAX_REPLY_CHARS = 280;

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

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const createReplyState = () => ({
  isOpen: false,
  isLoading: false,
  hasLoaded: false,
  replies: [],
  input: '',
  error: '',
  isSubmitting: false,
});

export default function EventList({
  events = [],
  onEventDeleted,
  onEventUpdated,
  currentUser,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [likingId, setLikingId] = useState(null);
  const [rsvpingId, setRsvpingId] = useState(null);
  const [replyState, setReplyState] = useState({});

  const getReplyState = (eventId) => replyState[eventId] || createReplyState();

  const updateReplyState = (eventId, updater) => {
    setReplyState((prev) => {
      const current = prev[eventId] || createReplyState();
      const next = updater(current);
      return { ...prev, [eventId]: next };
    });
  };

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [events]
  );

  const handleDelete = async (e, id) => {
    e.stopPropagation();
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

  const handleLike = async (e, event) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('You must be logged in to like events.');
      return;
    }

    setLikingId(event.id);

    try {
      const response = await fetch(`/api/events/${event.id}/likes`, {
        method: event.likedByCurrentUser ? 'DELETE' : 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update like');
      }

      onEventUpdated?.(data.event);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLikingId(null);
    }
  };

  const handleRsvp = async (e, event) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('You must be logged in to RSVP.');
      return;
    }

    setRsvpingId(event.id);

    try {
      const response = await fetch(`/api/events/${event.id}/rsvps`, {
        method: event.rsvpdByCurrentUser ? 'DELETE' : 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update RSVP');
      }

      onEventUpdated?.(data.event);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setRsvpingId(null);
    }
  };

  const handleToggleReplies = async (e, event) => {
    e.stopPropagation();
    const eventId = event.id;
    const state = getReplyState(eventId);

    if (state.isOpen) {
      updateReplyState(eventId, (current) => ({ ...current, isOpen: false }));
      return;
    }

    updateReplyState(eventId, (current) => ({
      ...current,
      isOpen: true,
      error: '',
    }));

    if (state.hasLoaded) {
      return;
    }

    updateReplyState(eventId, (current) => ({
      ...current,
      isLoading: true,
      error: '',
    }));

    try {
      const response = await fetch(`/api/events/${eventId}/replies`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load replies');
      }

      updateReplyState(eventId, (current) => ({
        ...current,
        replies: data.replies || [],
        hasLoaded: true,
        isLoading: false,
        error: '',
      }));

      if (data.event) {
        onEventUpdated?.(data.event);
      }
    } catch (err) {
      updateReplyState(eventId, (current) => ({
        ...current,
        isLoading: false,
        error: err.message,
      }));
    }
  };

  const handleReplyInputChange = (eventId, value) => {
    updateReplyState(eventId, (current) => ({
      ...current,
      input: value,
      error: '',
    }));
  };

  const handleReplySubmit = async (e, event) => {
    e.preventDefault();
    e.stopPropagation();
    const eventId = event.id;
    const state = getReplyState(eventId);
    const trimmed = state.input.trim();

    if (!currentUser) {
      alert('You must be logged in to reply.');
      return;
    }

    if (!trimmed) {
      updateReplyState(eventId, (current) => ({
        ...current,
        error: 'Reply cannot be empty.',
      }));
      return;
    }

    if (trimmed.length > MAX_REPLY_CHARS) {
      updateReplyState(eventId, (current) => ({
        ...current,
        error: `Replies are limited to ${MAX_REPLY_CHARS} characters.`,
      }));
      return;
    }

    updateReplyState(eventId, (current) => ({
      ...current,
      isSubmitting: true,
      error: '',
    }));

    try {
      const response = await fetch(`/api/events/${eventId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add reply');
      }

      updateReplyState(eventId, (current) => ({
        ...current,
        replies: [...current.replies, data.reply],
        input: '',
        isSubmitting: false,
        error: '',
        hasLoaded: true,
      }));

      if (data.event) {
        onEventUpdated?.(data.event);
      }
    } catch (err) {
      updateReplyState(eventId, (current) => ({
        ...current,
        isSubmitting: false,
        error: err.message,
      }));
    }
  };

  const handleShare = async (e, event) => {
    e.stopPropagation();
    const shareText = `${event.title}\n📅 ${formatDateTime(
      event.eventTime
    )}\n📍 ${event.location || 'TBA'}\n\nJoin us on Earth Link!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: shareText,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Event details copied to clipboard!');
      } catch {
        alert('Could not share event');
      }
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
    <>
      <div className="space-y-6">
        {sortedEvents.map((event) => {
          const eventDate = new Date(event.eventTime);
          const month = monthFormatter.format(eventDate);
          const day = eventDate.getDate();
          const replies = getReplyState(event.id);

          return (
            <article
              key={event.id}
              className="rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-sm transition hover:border-emerald-200"
            >
              {/* Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => setSelectedEvent(event)}
                    className="flex cursor-pointer flex-col items-center rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <span className="text-xs uppercase tracking-wide">
                      {month}
                    </span>
                    <span className="text-2xl font-semibold text-emerald-900">
                      {day}
                    </span>
                  </div>
                  <div>
                    <h4
                      onClick={() => setSelectedEvent(event)}
                      className="cursor-pointer text-lg font-semibold text-emerald-900 hover:underline"
                    >
                      {event.title}
                    </h4>
                    <p className="text-sm text-emerald-600">
                      Hosted by{' '}
                      <Link href="/profile" className="hover:underline">
                        {event.creatorName || 'Community'}
                      </Link>
                      {event.groupName && (
                        <>
                          {' '}
                          ·{' '}
                          <Link
                            href="/groups"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            {event.groupName}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* RSVP Button */}
                  <button
                    onClick={(e) => handleRsvp(e, event)}
                    disabled={rsvpingId === event.id}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      event.rsvpdByCurrentUser
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-sm hover:shadow-md'
                    } disabled:opacity-60`}
                  >
                    {rsvpingId === event.id ? (
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
                    ) : event.rsvpdByCurrentUser ? (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Going
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
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        RSVP
                      </>
                    )}
                  </button>

                  {currentUser?.id === event.creatorId && (
                    <button
                      onClick={(e) => handleDelete(e, event.id)}
                      disabled={deletingId === event.id}
                      className="rounded-full p-2 text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-60"
                      aria-label="Delete event"
                    >
                      {deletingId === event.id ? (
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
                      ) : (
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Event Details */}
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

              {/* RSVP Count Badge */}
              {(event.rsvpCount ?? 0) > 0 && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>
                    {event.rsvpCount}{' '}
                    {event.rsvpCount === 1 ? 'person' : 'people'} going
                  </span>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <p className="mt-4 text-sm leading-relaxed text-emerald-900 whitespace-pre-wrap line-clamp-3">
                  {event.description}
                </p>
              )}

              {/* Interaction Bar */}
              <div className="mt-5 flex items-center gap-6 border-t border-emerald-100 pt-4 text-sm text-emerald-600">
                <button
                  onClick={(e) => handleLike(e, event)}
                  disabled={likingId === event.id}
                  className={`flex items-center gap-1.5 transition-colors ${
                    event.likedByCurrentUser
                      ? 'text-red-600'
                      : 'hover:text-emerald-800'
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill={event.likedByCurrentUser ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{event.likesCount ?? 0}</span>
                </button>

                <button
                  onClick={(e) => handleToggleReplies(e, event)}
                  className="flex items-center gap-1.5 hover:text-emerald-800 transition-colors"
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>{event.repliesCount ?? 0}</span>
                </button>

                <button
                  onClick={(e) => handleShare(e, event)}
                  className="flex items-center gap-1.5 hover:text-emerald-800 transition-colors"
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
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  <span>Share</span>
                </button>

                <button
                  onClick={() => setSelectedEvent(event)}
                  className="ml-auto flex items-center gap-1.5 text-emerald-500 hover:text-emerald-700 transition-colors"
                >
                  <span>View details</span>
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Replies Section */}
              {replies.isOpen && (
                <div
                  className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {replies.isLoading ? (
                    <p className="text-sm text-emerald-600">
                      Loading replies...
                    </p>
                  ) : replies.replies.length === 0 ? (
                    <p className="text-sm text-emerald-600">
                      No replies yet. Start the conversation!
                    </p>
                  ) : (
                    <ul className="mb-4 space-y-3">
                      {replies.replies.map((reply) => (
                        <li
                          key={reply.id}
                          className="rounded-2xl bg-white/80 p-3 shadow-sm"
                        >
                          <div className="mb-1 text-sm font-semibold text-emerald-900">
                            {reply.authorName}{' '}
                            <span className="text-xs text-emerald-500">
                              @{reply.authorHandle}
                            </span>
                          </div>
                          <p className="text-sm text-emerald-800">
                            {reply.body}
                          </p>
                          <time
                            className="mt-1 block text-xs text-emerald-500"
                            dateTime={reply.createdAt}
                          >
                            {formatDate(reply.createdAt)}
                          </time>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    onSubmit={(e) => handleReplySubmit(e, event)}
                    className="space-y-2"
                  >
                    <textarea
                      value={replies.input}
                      onChange={(e) =>
                        handleReplyInputChange(event.id, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Write a reply..."
                      rows={3}
                      className="w-full rounded-xl border border-emerald-100 bg-white/90 p-3 text-sm text-emerald-900 transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      disabled={replies.isSubmitting}
                    />
                    <div className="flex items-center justify-between text-xs text-emerald-600">
                      <span>
                        {replies.input.length} / {MAX_REPLY_CHARS}
                      </span>
                      {replies.error && (
                        <span className="text-red-600">{replies.error}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <button
                        type="submit"
                        disabled={
                          replies.isSubmitting ||
                          !replies.input.trim() ||
                          replies.input.length > MAX_REPLY_CHARS
                        }
                        className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {replies.isSubmitting ? 'Replying...' : 'Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </>
  );
}
