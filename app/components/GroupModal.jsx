'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_MB = 2;

const generateImageId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function GroupModal({
  isOpen,
  onClose,
  onGroupCreated,
  onGroupUpdated,
  editGroup = null,
}) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [icon, setIcon] = useState(null);
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const isEditMode = !!editGroup;

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

  useEffect(() => {
    if (isOpen && editGroup) {
      // Populate form with existing data
      setName(editGroup.name || '');
      setLocation(editGroup.location || '');
      setDescription(editGroup.description || '');
      setWebsiteUrl(editGroup.websiteUrl || '');
      setIcon(editGroup.iconData || null);
      // Convert existing images to our format
      const existingImages = Array.isArray(editGroup.images)
        ? editGroup.images.map((dataUrl) => ({
            id: generateImageId(),
            dataUrl,
          }))
        : [];
      setImages(existingImages);
    } else if (!isOpen) {
      // Reset form when closing
      setName('');
      setLocation('');
      setDescription('');
      setWebsiteUrl('');
      setIcon(null);
      setImages([]);
      setImageError('');
      setError('');
    }
  }, [isOpen, editGroup]);

  const handleIconChange = async (event) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageError('Only image files are supported for icon.');
      input.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setImageError(`Icon must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
      input.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIcon(reader.result?.toString() || null);
        setImageError('');
      };
      reader.onerror = () => {
        setImageError('Failed to read icon file.');
      };
      reader.readAsDataURL(file);
    } catch {
      setImageError('Unable to read icon file.');
    } finally {
      input.value = '';
    }
  };

  const handleRemoveIcon = () => {
    setIcon(null);
  };

  const handleImageChange = async (event) => {
    setImageError('');
    const input = event.target;
    const files = Array.from(input.files || []);

    if (files.length === 0) {
      input.value = '';
      return;
    }

    const availableSlots = MAX_IMAGES - images.length;
    if (availableSlots <= 0) {
      setImageError(`You can upload up to ${MAX_IMAGES} images per group.`);
      input.value = '';
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    const validFiles = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        setImageError('Only image files are supported.');
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setImageError(
          `Each image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      input.value = '';
      return;
    }

    try {
      const newImages = await Promise.all(
        validFiles.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve({
                  id: generateImageId(),
                  dataUrl: reader.result?.toString() || '',
                });
              reader.onerror = () =>
                reject(new Error('Failed to read selected file.'));
              reader.readAsDataURL(file);
            })
        )
      );

      setImages((prev) => [
        ...prev,
        ...newImages.filter((image) => image.dataUrl),
      ]);
    } catch (err) {
      setImageError(err.message || 'Unable to read one of the files.');
    } finally {
      input.value = '';
    }
  };

  const handleRemoveImage = (imageId) => {
    setImages((prev) => prev.filter((image) => image.id !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setImageError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        icon: icon,
        images: images.map((img) => img.dataUrl),
      };

      const url = isEditMode ? `/api/groups/${editGroup.id}` : '/api/groups';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save group');

      if (isEditMode) {
        onGroupUpdated?.(data.group);
      } else {
        onGroupCreated?.(data.group);
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

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
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-500">
                {isEditMode ? 'Edit group' : 'New group'}
              </p>
              <h3 className="text-lg font-semibold text-emerald-900">
                {isEditMode ? 'Update details' : 'Start a community'}
              </h3>
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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {/* Group Icon */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-emerald-700">
                  Group Icon
                </label>
                <div className="flex items-center gap-4">
                  {icon ? (
                    <div className="group relative">
                      <img
                        src={icon}
                        alt="Group icon"
                        className="h-16 w-16 rounded-2xl object-cover border border-emerald-100"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveIcon}
                        className="absolute -right-2 -top-2 rounded-full bg-emerald-900/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-500">
                      <svg
                        className="h-8 w-8"
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
                    </div>
                  )}
                  <label className="cursor-pointer rounded-full border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">
                    {icon ? 'Change icon' : 'Upload icon'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-emerald-700">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Bay Area Tree Planters"
                  className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-emerald-900 transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-emerald-700">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-emerald-900 transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-emerald-700">
                  Website Link
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-emerald-900 transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-emerald-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this group about? What activities do you organize?"
                  rows={3}
                  className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-emerald-900 transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-emerald-700">
                  <span>Group Images</span>
                  <span className="text-emerald-500">
                    {images.length} / {MAX_IMAGES}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="w-full cursor-pointer rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-4 text-sm text-emerald-700 transition hover:border-emerald-400"
                />
                {imageError && (
                  <p className="text-sm text-red-600">{imageError}</p>
                )}
                {images.length > 0 && (
                  <div
                    className={`grid gap-3 ${
                      images.length === 1 ? '' : 'grid-cols-2'
                    }`}
                  >
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/50"
                      >
                        <img
                          src={image.dataUrl}
                          alt="Selected preview"
                          className="h-32 w-full object-cover"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          aria-label="Remove image"
                          className="absolute right-2 top-2 rounded-full bg-emerald-900/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                          onClick={() => handleRemoveImage(image.id)}
                          disabled={isSubmitting}
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
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-emerald-100 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full border border-emerald-200 px-5 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isSubmitting
                  ? isEditMode
                    ? 'Saving…'
                    : 'Creating…'
                  : isEditMode
                  ? 'Save changes'
                  : 'Create group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
