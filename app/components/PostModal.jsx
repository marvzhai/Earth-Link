'use client';

import { useState, useEffect } from 'react';

const MAX_CHARS = 280;
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_MB = 2;

const generateImageId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function PostModal({
  isOpen,
  onClose,
  onPostCreated,
  currentUser,
}) {
  const [body, setBody] = useState('');
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);

  // Close modal on Escape key
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
    if (!isOpen) {
      setBody('');
      setCharCount(0);
      setImages([]);
      setImageError('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleBodyChange = (e) => {
    const text = e.target.value;
    setBody(text);
    setCharCount(text.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setImageError('');

    if (!body.trim()) {
      setError('Post body cannot be empty');
      return;
    }

    if (body.length > MAX_CHARS) {
      setError(`Post exceeds maximum length of ${MAX_CHARS} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: body.trim(),
          images: images.map((image) => image.dataUrl),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setError(data.error || 'Please log in to create a post.');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      setBody('');
      setCharCount(0);
      setImages([]);
      setImageError('');
      setError('');
      onPostCreated?.(data.post);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !currentUser) return null;

  const isNearLimit = charCount > MAX_CHARS * 0.8;
  const isOverLimit = charCount > MAX_CHARS;

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
      setImageError(`You can upload up to ${MAX_IMAGES} images per post.`);
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-emerald-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-emerald-100 max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-100 p-6">
            <div>
              <h2 className="text-xl font-semibold text-emerald-900">
                Create a Post
              </h2>
              <p className="text-sm text-emerald-600">
                Posting as {currentUser.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-400 transition-colors hover:text-emerald-700"
              aria-label="Close"
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

          {/* Content */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 space-y-4 overflow-y-auto p-6 pr-4">
              <textarea
                value={body}
                onChange={handleBodyChange}
                placeholder="What's on your mind?"
                className={`w-full resize-none rounded-2xl border bg-emerald-50/60 p-4 text-emerald-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isOverLimit
                    ? 'border-red-400 bg-white focus:ring-red-500'
                    : 'border-emerald-100'
                }`}
                rows="8"
                disabled={isSubmitting}
                autoFocus
              />

              {/* Character counter */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    isOverLimit
                      ? 'text-red-600'
                      : isNearLimit
                      ? 'text-amber-600'
                      : 'text-emerald-500'
                  }`}
                >
                  {charCount} / {MAX_CHARS}
                </span>

                {error && <span className="text-sm text-red-600">{error}</span>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-emerald-900">
                  <span>Add images</span>
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
                  className="w-full cursor-pointer rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-sm text-emerald-700 transition hover:border-emerald-400"
                />
                {imageError && (
                  <p className="text-sm text-red-600">{imageError}</p>
                )}
                {images.length > 0 && (
                  <div
                    className={`grid gap-3 ${
                      images.length === 1 ? '' : 'sm:grid-cols-2'
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
                          className="h-48 w-full object-cover"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          aria-label="Remove image"
                          className="absolute right-3 top-3 rounded-full bg-emerald-900/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
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
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-emerald-100 bg-white/95 p-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full px-5 py-2 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !body.trim() || isOverLimit}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-6 py-2 text-white shadow-sm transition hover:shadow disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
