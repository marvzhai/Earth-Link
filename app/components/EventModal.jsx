'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import LocationPicker from './LocationPicker';

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_MB = 2;

export default function EventModal({
  isOpen,
  onClose,
  onEventCreated,
  onEventUpdated,
  groups = [],
  editEvent = null, // Pass event object to enable edit mode
}) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [description, setDescription] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [groupId, setGroupId] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!editEvent;

  // Force a re-render after mount to ensure portal target is available
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    forceUpdate(1);
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title || '');
      setLocation(editEvent.location || '');
      setLatitude(editEvent.latitude || null);
      setLongitude(editEvent.longitude || null);
      setDescription(editEvent.description || '');
      setGroupId(editEvent.groupId ? String(editEvent.groupId) : '');
      // Format datetime-local value
      if (editEvent.eventTime) {
        const date = new Date(editEvent.eventTime);
        const formatted = date.toISOString().slice(0, 16);
        setEventTime(formatted);
      }
      // Convert existing images to the format we use
      if (editEvent.images && Array.isArray(editEvent.images)) {
        setImages(
          editEvent.images.map((img, idx) => ({
            id: `existing-${idx}`,
            dataUrl: img,
          }))
        );
      }
    }
  }, [editEvent]);

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
    setLatitude(null);
    setLongitude(null);
    setDescription('');
    setEventTime('');
    setGroupId('');
    setImages([]);
    setError('');
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleLocationChange = useCallback(({ name, lat, lng }) => {
    setLocation(name);
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`Images must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            dataUrl: event.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

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
      const payload = {
        title: title.trim(),
        location: location.trim(),
        latitude,
        longitude,
        description: description.trim(),
        eventTime,
        groupId: groupId ? Number(groupId) : null,
        images: images.map((img) => img.dataUrl),
      };

      const url = isEditMode ? `/api/events/${editEvent.id}` : '/api/events';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || `Failed to ${isEditMode ? 'update' : 'create'} event`
        );

      if (isEditMode) {
        onEventUpdated?.(data.event);
      } else {
        onEventCreated?.(data.event);
      }
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
        <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-emerald-100 max-h-[90vh]">
          <div className="flex items-center justify-between border-b border-emerald-100 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-500">
                {isEditMode ? 'Edit event' : 'New event'}
              </p>
              <h3 className="text-lg font-semibold text-emerald-900">
                {isEditMode ? 'Update your gathering' : 'Share a gathering'}
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

              {/* Location Picker with Map */}
              <div>
                <label className="text-sm font-medium text-emerald-900 mb-2 block">
                  Location
                </label>
                <LocationPicker
                  initialLocation={location}
                  initialLat={latitude}
                  initialLng={longitude}
                  onLocationChange={handleLocationChange}
                />
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
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-900">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Share any details, supplies to bring, or meetup instructions."
                />
              </div>

              {/* Image Upload */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-emerald-900">
                    Photos (optional)
                  </label>
                  <span className="text-xs text-emerald-500">
                    {images.length}/{MAX_IMAGES}
                  </span>
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-emerald-100"
                      >
                        <img
                          src={img.dataUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {images.length < MAX_IMAGES && (
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-4 text-sm text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50">
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Add photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
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
                {isSubmitting
                  ? isEditMode
                    ? 'Saving…'
                    : 'Creating…'
                  : isEditMode
                  ? 'Save changes'
                  : 'Post event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
