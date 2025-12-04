'use client';

import { useState } from 'react';

const MAX_REPLY_CHARS = 280;

const createReplyState = () => ({
  isOpen: false,
  isLoading: false,
  hasLoaded: false,
  replies: [],
  input: '',
  error: '',
  isSubmitting: false,
});

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatRelativeDate = (dateString) => {
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
};

export default function EventCard({
  event,
  index = 0,
  currentUser,
  onEventUpdated,
  onEventDeleted,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [likingId, setLikingId] = useState(null);
  const [rsvpingId, setRsvpingId] = useState(null);
  const [replyState, setReplyState] = useState(createReplyState());

  const updateReplyState = (updater) => {
    setReplyState((prev) => updater(prev));
  };

  const eventDate = new Date(event.eventTime);
  const month = monthFormatter.format(eventDate);
  const day = eventDate.getDate();

  const eventImages = Array.isArray(event.images) ? event.images : [];

  const getColor = (idx) => {
    const colors = [
      'bg-gradient-to-br from-emerald-500 to-green-500',
      'bg-gradient-to-br from-lime-400 to-emerald-500',
      'bg-gradient-to-br from-teal-400 to-emerald-600',
      'bg-gradient-to-br from-emerald-400 to-cyan-500',
      'bg-gradient-to-br from-green-400 to-lime-500',
      'bg-gradient-to-br from-emerald-500 to-lime-600',
    ];
    return colors[idx % colors.length];
  };

  const handleDelete = async () => {
    if (!currentUser) {
      alert('You must be logged in to delete events.');
      return;
    }

    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setDeletingId(event.id);

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event');
      }

      onEventDeleted?.(event.id);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLike = async () => {
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

  const handleRsvp = async () => {
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

  const handleToggleReplies = async () => {
    if (replyState.isOpen) {
      updateReplyState((current) => ({ ...current, isOpen: false }));
      return;
    }

    updateReplyState((current) => ({ ...current, isOpen: true, error: '' }));

    if (replyState.hasLoaded) {
      return;
    }

    updateReplyState((current) => ({ ...current, isLoading: true, error: '' }));

    try {
      const response = await fetch(`/api/events/${event.id}/replies`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load replies');
      }

      updateReplyState((current) => ({
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
      updateReplyState((current) => ({
        ...current,
        isLoading: false,
        error: err.message,
      }));
    }
  };

  const handleReplyInputChange = (value) => {
    updateReplyState((current) => ({ ...current, input: value, error: '' }));
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const trimmed = replyState.input.trim();

    if (!currentUser) {
      alert('You must be logged in to reply.');
      return;
    }

    if (!trimmed) {
      updateReplyState((current) => ({
        ...current,
        error: 'Reply cannot be empty.',
      }));
      return;
    }

    if (trimmed.length > MAX_REPLY_CHARS) {
      updateReplyState((current) => ({
        ...current,
        error: `Replies are limited to ${MAX_REPLY_CHARS} characters.`,
      }));
      return;
    }

    updateReplyState((current) => ({
      ...current,
      isSubmitting: true,
      error: '',
    }));

    try {
      const response = await fetch(`/api/events/${event.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add reply');
      }

      updateReplyState((current) => ({
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
      updateReplyState((current) => ({
        ...current,
        isSubmitting: false,
        error: err.message,
      }));
    }
  };

  return (
    <article className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm transition hover:border-emerald-200">
      {/* Event Badge */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-lime-100 px-3 py-1 text-xs font-medium text-emerald-800">
        <svg
          className="h-3.5 w-3.5"
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
        Event
      </div>

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Date Badge */}
          <div className="flex flex-col items-center rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700">
            <span className="text-xs uppercase tracking-wide">{month}</span>
            <span className="text-2xl font-semibold text-emerald-900">
              {day}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-emerald-900">
              {event.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-emerald-600">
              <span>
                by {event.creatorName || 'Unknown'} · @{event.creatorHandle}
              </span>
              {event.groupName && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
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
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-emerald-500">
              Posted {formatRelativeDate(event.createdAt)}
            </p>
          </div>
        </div>

        {currentUser?.id === event.creatorId && (
          <button
            onClick={handleDelete}
            disabled={deletingId === event.id}
            className="rounded-full px-3 py-1 text-xs font-medium text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Delete event"
          >
            {deletingId === event.id ? (
              <svg
                className="h-4 w-4 animate-spin"
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
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Event Details */}
      <div className="mb-4 grid gap-2 text-sm text-emerald-700 sm:grid-cols-2">
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
              strokeWidth={2}
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
              strokeWidth={2}
              d="M17.657 16.657L13.414 12.414a4 4 0 10-1.414 1.414l4.243 4.243a1 1 0 001.414-1.414zM12 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {event.location || 'Location TBA'}
        </div>
      </div>

      {/* Images */}
      {eventImages.length > 0 && (
        <div
          className={`mb-4 ${
            eventImages.length === 1
              ? 'overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40'
              : 'grid gap-3 sm:grid-cols-2'
          }`}
        >
          {eventImages.map((src, imageIndex) => (
            <div
              key={`${event.id}-${imageIndex}`}
              className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40"
            >
              <img
                src={src}
                alt={`Event media ${imageIndex + 1}`}
                className={`w-full object-cover ${
                  eventImages.length === 1 ? 'h-64' : 'h-48'
                }`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {event.description && (
        <p className="mb-4 whitespace-pre-wrap text-emerald-900 leading-relaxed">
          {event.description}
        </p>
      )}

      {/* RSVP Button */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handleRsvp}
          disabled={rsvpingId === event.id}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            event.rsvpdByCurrentUser
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={event.rsvpdByCurrentUser ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {event.rsvpdByCurrentUser ? 'Going' : 'RSVP'}
        </button>
        <span className="text-sm text-emerald-600">
          {event.rsvpCount || 0} {event.rsvpCount === 1 ? 'person' : 'people'}{' '}
          going
        </span>
        {event.rsvpLink && (
          <a
            href={event.rsvpLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-600 underline hover:text-emerald-800"
          >
            External link
          </a>
        )}
      </div>

      {/* Interaction Bar */}
      <div className="flex items-center gap-6 text-sm text-emerald-600">
        <button
          onClick={handleLike}
          disabled={likingId === event.id}
          className={`flex items-center gap-1.5 transition-colors ${
            event.likedByCurrentUser ? 'text-red-600' : 'hover:text-stone-800'
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
          onClick={handleToggleReplies}
          className="flex items-center gap-1.5 transition-colors hover:text-stone-800"
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

        <button className="flex items-center gap-1.5 transition-colors hover:text-stone-800">
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
      </div>

      {/* Replies Section */}
      {replyState.isOpen && (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          {replyState.isLoading ? (
            <p className="text-sm text-emerald-600">Loading replies...</p>
          ) : replyState.replies.length === 0 ? (
            <p className="text-sm text-emerald-600">
              No replies yet. Start the conversation!
            </p>
          ) : (
            <ul className="mb-4 space-y-3">
              {replyState.replies.map((reply) => (
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
                  <p className="text-sm text-emerald-800">{reply.body}</p>
                  <time
                    className="mt-1 block text-xs text-emerald-500"
                    dateTime={reply.createdAt}
                  >
                    {formatRelativeDate(reply.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleReplySubmit} className="space-y-2">
            <textarea
              value={replyState.input}
              onChange={(e) => handleReplyInputChange(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              className="w-full rounded-xl border border-emerald-100 bg-white/90 p-3 text-sm text-emerald-900 transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              disabled={replyState.isSubmitting}
            />
            <div className="flex items-center justify-between text-xs text-emerald-600">
              <span>
                {replyState.input.length} / {MAX_REPLY_CHARS}
              </span>
              {replyState.error && (
                <span className="text-red-600">{replyState.error}</span>
              )}
            </div>
            <div className="text-right">
              <button
                type="submit"
                disabled={
                  replyState.isSubmitting ||
                  !replyState.input.trim() ||
                  replyState.input.length > MAX_REPLY_CHARS
                }
                className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:shadow-md disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {replyState.isSubmitting ? 'Replying...' : 'Reply'}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

