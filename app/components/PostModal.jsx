'use client';

import { useState, useEffect } from 'react';

export default function PostModal({ isOpen, onClose, onPostCreated }) {
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const maxChars = 280;

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

  const handleBodyChange = (e) => {
    const text = e.target.value;
    setBody(text);
    setCharCount(text.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!body.trim()) {
      setError('Post body cannot be empty');
      return;
    }

    if (body.length > maxChars) {
      setError(`Post exceeds maximum length of ${maxChars} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: body.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      setBody('');
      setCharCount(0);
      setError('');
      onPostCreated(data.post);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const charPercentage = (charCount / maxChars) * 100;
  const isNearLimit = charCount > maxChars * 0.8;
  const isOverLimit = charCount > maxChars;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-stone-200">
            <h2 className="text-xl font-semibold text-stone-800">
              Create a Post
            </h2>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <textarea
              value={body}
              onChange={handleBodyChange}
              placeholder="What's on your mind?"
              className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent resize-none text-stone-800 transition-all ${
                isOverLimit ? 'border-red-400 focus:ring-red-500' : 'border-stone-200'
              }`}
              rows="8"
              disabled={isSubmitting}
              autoFocus
            />
            
            {/* Character counter */}
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-sm ${
                isOverLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-stone-400'
              }`}>
                {charCount} / {maxChars}
              </span>
              
              {error && (
                <span className="text-sm text-red-600">{error}</span>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2 text-stone-700 hover:bg-stone-100 rounded-lg disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !body.trim() || isOverLimit}
                className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors font-medium"
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

