'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function GroupDetailModal({ isOpen, onClose, group }) {
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

  if (!isOpen || !mounted || !group) return null;

  const groupImages = Array.isArray(group.images) ? group.images : [];

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop - full screen coverage */}
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
              {group.iconData ? (
                <img
                  src={group.iconData}
                  alt={`${group.name} icon`}
                  className="h-12 w-12 rounded-2xl object-cover border border-emerald-100"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 text-lg font-medium text-white">
                  {group.name?.[0]?.toUpperCase() || 'G'}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-emerald-900">
                  {group.name}
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
            {/* Images */}
            {groupImages.length > 0 && (
              <div
                className={`${
                  groupImages.length === 1
                    ? 'overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40'
                    : 'grid gap-3 grid-cols-2'
                }`}
              >
                {groupImages.map((src, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40"
                  >
                    <img
                      src={src}
                      alt={`${group.name} image ${index + 1}`}
                      className={`w-full object-cover ${
                        groupImages.length === 1 ? 'h-56' : 'h-40'
                      }`}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}

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
              <span>{group.location || 'Location TBA'}</span>
            </div>

            {/* Website Link */}
            {group.websiteUrl && (
              <a
                href={group.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700 transition hover:bg-emerald-100"
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span className="truncate">{group.websiteUrl}</span>
                <svg
                  className="h-4 w-4 ml-auto flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}

            {/* Description */}
            {group.description ? (
              <div>
                <h4 className="mb-2 text-sm font-medium text-emerald-700">
                  About
                </h4>
                <p className="whitespace-pre-wrap text-emerald-900 leading-relaxed">
                  {group.description}
                </p>
              </div>
            ) : (
              <p className="text-emerald-600 italic">
                No description provided.
              </p>
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
