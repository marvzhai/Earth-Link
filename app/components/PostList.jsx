'use client';

import { useState } from 'react';

export default function PostList({ posts = [], onPostDeleted, currentUser }) {
  const [deletingId, setDeletingId] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());

  const handleDelete = async (postId) => {
    if (!currentUser) {
      alert('You must be logged in to delete posts.');
      return;
    }

    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setDeletingId(postId);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error(data.error || 'Please log in to continue.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete post');
      }

      if (onPostDeleted) {
        onPostDeleted(postId);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLike = (postId) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
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

  const getColor = (index) => {
    const colors = [
      'bg-gradient-to-br from-emerald-500 to-green-500',
      'bg-gradient-to-br from-lime-400 to-emerald-500',
      'bg-gradient-to-br from-teal-400 to-emerald-600',
      'bg-gradient-to-br from-emerald-400 to-cyan-500',
      'bg-gradient-to-br from-green-400 to-lime-500',
      'bg-gradient-to-br from-emerald-500 to-lime-600',
    ];
    return colors[index % colors.length];
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">🌱</div>
        <h3 className="text-2xl font-semibold text-emerald-900 mb-3">
          No posts yet
        </h3>
        <p className="text-emerald-700 max-w-md mx-auto">
          Be the first to share something! Tap the + badge to start a new note.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <article
          key={post.id}
          className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm transition hover:border-emerald-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Simple Avatar */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${getColor(
                  index
                )} text-white font-medium text-sm`}
              >
                {post.authorName?.[0]?.toUpperCase() || 'U'}
              </div>

              <div>
                <h3 className="font-semibold text-emerald-900">
                  {post.authorName || 'Unknown User'}
                </h3>
                <div className="flex items-center text-sm text-emerald-600 mt-0.5">
                  <span>@{post.authorHandle}</span>
                  <span className="mx-2">·</span>
                  <time dateTime={post.createdAt}>
                    {formatDate(post.createdAt)}
                  </time>
                </div>
              </div>
            </div>

            {currentUser?.id === post.authorId && (
              <button
                onClick={() => handleDelete(post.id)}
                disabled={deletingId === post.id}
                className="rounded-full px-3 py-1 text-xs font-medium text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                aria-label="Delete post"
              >
                {deletingId === post.id ? (
                  <svg
                    className="animate-spin h-4 w-4"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
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

          {/* Post Content */}
          <div className="text-emerald-900 leading-relaxed whitespace-pre-wrap break-words mb-5">
            {post.body}
          </div>

          {/* Simple Interaction Bar */}
          <div className="flex items-center gap-6 text-sm text-emerald-600">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center gap-1.5 hover:text-stone-800 transition-colors ${
                likedPosts.has(post.id) ? 'text-red-600' : ''
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
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
              <span>Like</span>
            </button>

            <button className="flex items-center gap-1.5 hover:text-stone-800 transition-colors">
              <svg
                className="w-4 h-4"
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
              <span>Reply</span>
            </button>

            <button className="flex items-center gap-1.5 hover:text-stone-800 transition-colors">
              <svg
                className="w-4 h-4"
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
        </article>
      ))}
    </div>
  );
}
