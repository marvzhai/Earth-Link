'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function EventModal({
  isOpen,
  onClose,
  onEventCreated,
  groups = [],
}) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Force a re-render after mount to ensure portal target is available
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    forceUpdate(1);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setEventTime('');
    setGroupId('');
    setError('');
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!eventTime) {
      setError('Event time is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          location: location.trim(),
          description: description.trim(),
          eventTime,
          groupId: groupId ? Number(groupId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');
      onEventCreated?.(data.event);
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if we're in browser environment for portal
  if (!isOpen || typeof window === 'undefined') return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 h-full w-full bg-emerald-900/50 backdrop-blur-sm"
        style={{ minHeight: '100vh', minWidth: '100vw' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="absolute inset-0 flex h-full w-full items-center justify-center overflow-y-auto p-4">
        <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-emerald-100 max-h-[90vh]">
          <div className="flex items-center justify-between border-b border-emerald-100 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-500">
                New event
              </p>
              <h3 className="text-lg font-semibold text-emerald-900">
                Share a gathering
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-400 transition hover:text-emerald-700"
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
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <div>
                <label className="text-sm font-medium text-emerald-900">
                  Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Sunrise cleanup at Ocean Beach"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-emerald-900">
                    When *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-emerald-900">
                    Location
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Golden Gate Park"
                  />
                </div>
              </div>

              {/* Group Selector */}
              <div>
                <label className="text-sm font-medium text-emerald-900">
                  Hosting Group (optional)
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">No group - personal event</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-emerald-500">
                  Associate this event with a group you created or belong to
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-900">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Share any details, supplies to bring, or meetup instructions."
                />
              </div>

              {error && (
                <div className="text-sm text-red-600" role="alert">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-emerald-100 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full px-5 py-2 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2 text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isSubmitting ? 'Creating…' : 'Post event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
