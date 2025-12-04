'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

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
    year: 'numeric',
  })} at ${timeFormatter.format(date)}`;
}

export default function EventDetailModal({ isOpen, onClose, event }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!isOpen || !mounted || !event) return null;

  const eventDate = new Date(event.eventTime);
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const month = monthFormatter.format(eventDate);
  const day = eventDate.getDate();

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
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-100 px-6 py-4">
            <div className="flex items-center gap-4">
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
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-400 transition hover:text-emerald-700"
            >
              <svg
                className="h-6 w-6"
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {/* Host Info */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 text-sm font-medium text-white">
                {event.creatorName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm text-emerald-600">Hosted by</p>
                <Link
                  href={`/profile/${event.creatorId}`}
                  onClick={onClose}
                  className="font-medium text-emerald-900 hover:underline"
                >
                  {event.creatorName || 'Unknown'}{' '}
                  <span className="text-emerald-500">
                    @{event.creatorHandle}
                  </span>
                </Link>
              </div>
            </div>

            {/* Group Info */}
            {event.groupId && event.groupName && (
              <Link
                href={`/groups?view=${event.groupId}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700 transition hover:bg-emerald-100"
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs text-emerald-500">Organized by group</p>
                  <p className="font-medium text-emerald-900">
                    {event.groupName}
                  </p>
                </div>
              </Link>
            )}

            {/* Date & Time */}
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatDateTime(event.eventTime)}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
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
                  d="M17.657 16.657L13.414 12.414a4 4 0 10-1.414 1.414l4.243 4.243a1 1 0 001.414-1.414zM12 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{event.location || 'Location TBA'}</span>
            </div>

            {/* Description */}
            {event.description ? (
              <div>
                <h4 className="mb-2 text-sm font-medium text-emerald-700">
                  About this event
                </h4>
                <p className="whitespace-pre-wrap text-emerald-900 leading-relaxed">
                  {event.description}
                </p>
              </div>
            ) : (
              <p className="text-emerald-600 italic">No description provided.</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-emerald-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-emerald-200 px-5 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

