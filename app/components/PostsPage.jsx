'use client';

import { useEffect, useMemo, useState } from 'react';
import PostList from './PostList';
import EventCard from './EventCard';

const FILTER_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Posts', value: 'posts' },
  { label: 'Events', value: 'events' },
];

export default function PostsPage({ initialFeed = [], currentUser }) {
  const [feed, setFeed] = useState(initialFeed);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setFeed(initialFeed);
  }, [initialFeed]);

  const handleItemDeleted = (itemId, itemType) => {
    setFeed((prev) =>
      prev.filter((item) => !(item.id === itemId && item.type === itemType))
    );
  };

  const handleItemUpdated = (updatedItem) => {
    setFeed((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id && item.type === updatedItem.type
          ? updatedItem
          : item
      )
    );
  };

  const filteredFeed = useMemo(() => {
    if (filter === 'posts') {
      return feed.filter((item) => item.type === 'post');
    }
    if (filter === 'events') {
      return feed.filter((item) => item.type === 'event');
    }
    return feed;
  }, [filter, feed]);

  const posts = filteredFeed.filter((item) => item.type === 'post');
  const events = filteredFeed.filter((item) => item.type === 'event');

  return (
    <>
      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === tab.value
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {filteredFeed.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-6 text-6xl">🌱</div>
          <h3 className="mb-3 text-2xl font-semibold text-emerald-900">
            {filter === 'events'
              ? 'No events yet'
              : filter === 'posts'
              ? 'No posts yet'
              : 'Your feed is empty'}
          </h3>
          <p className="mx-auto max-w-md text-emerald-600">
            {filter === 'events'
              ? 'Create an event to bring the community together.'
              : filter === 'posts'
              ? 'Share a thought or update with the community.'
              : 'Be the first to post something or create an event!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFeed.map((item, index) => {
            if (item.type === 'event') {
              return (
                <EventCard
                  key={`event-${item.id}`}
                  event={item}
                  index={index}
                  currentUser={currentUser}
                  onEventUpdated={handleItemUpdated}
                  onEventDeleted={(id) => handleItemDeleted(id, 'event')}
                />
              );
            }

            // For posts, we render them inline here instead of using PostList
            // to maintain the correct order in the combined feed
            return (
              <PostCard
                key={`post-${item.id}`}
                post={item}
                index={index}
                currentUser={currentUser}
                onPostUpdated={handleItemUpdated}
                onPostDeleted={(id) => handleItemDeleted(id, 'post')}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

// Inline PostCard component to maintain feed ordering
function PostCard({ post, index, currentUser, onPostUpdated, onPostDeleted }) {
  const [deletingId, setDeletingId] = useState(null);
  const [likingId, setLikingId] = useState(null);
  const [replyState, setReplyState] = useState({
    isOpen: false,
    isLoading: false,
    hasLoaded: false,
    replies: [],
    input: '',
    error: '',
    isSubmitting: false,
  });

  const MAX_REPLY_CHARS = 280;

  const updateReplyState = (updater) => {
    setReplyState((prev) => updater(prev));
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

  const postImages = Array.isArray(post.images) ? post.images : [];

  const handleDelete = async () => {
    if (!currentUser) {
      alert('You must be logged in to delete posts.');
      return;
    }

    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setDeletingId(post.id);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete post');
      }

      onPostDeleted?.(post.id);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('You must be logged in to like posts.');
      return;
    }

    setLikingId(post.id);

    try {
      const response = await fetch(`/api/posts/${post.id}/likes`, {
        method: post.likedByCurrentUser ? 'DELETE' : 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update like');
      }

      onPostUpdated?.(data.post);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLikingId(null);
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
      const response = await fetch(`/api/posts/${post.id}/replies`);
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

      if (data.post) {
        onPostUpdated?.(data.post);
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
      const response = await fetch(`/api/posts/${post.id}/replies`, {
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

      if (data.post) {
        onPostUpdated?.(data.post);
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
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${getColor(
              index
            )} text-sm font-medium text-white`}
          >
            {post.authorName?.[0]?.toUpperCase() || 'U'}
          </div>

          <div>
            <h3 className="font-semibold text-emerald-900">
              {post.authorName || 'Unknown User'}
            </h3>
            <div className="mt-0.5 flex items-center text-sm text-emerald-600">
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
            onClick={handleDelete}
            disabled={deletingId === post.id}
            className="rounded-full px-3 py-1 text-xs font-medium text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Delete post"
          >
            {deletingId === post.id ? (
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

      {/* Media */}
      {postImages.length > 0 && (
        <div
          className={`mb-5 ${
            postImages.length === 1
              ? 'overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40'
              : 'grid gap-3 sm:grid-cols-2'
          }`}
        >
          {postImages.map((src, imageIndex) => (
            <div
              key={`${post.id}-${imageIndex}`}
              className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40"
            >
              <img
                src={src}
                alt={`Shared media ${imageIndex + 1} by ${
                  post.authorName || 'user'
                }`}
                className={`w-full object-cover ${
                  postImages.length === 1 ? 'h-64' : 'h-48'
                }`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Post Content */}
      <div className="mb-5 whitespace-pre-wrap break-words leading-relaxed text-emerald-900">
        {post.body}
      </div>

      {/* Interaction Bar */}
      <div className="flex items-center gap-6 text-sm text-emerald-600">
        <button
          onClick={handleLike}
          disabled={likingId === post.id}
          className={`flex items-center gap-1.5 transition-colors ${
            post.likedByCurrentUser ? 'text-red-600' : 'hover:text-stone-800'
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={post.likedByCurrentUser ? 'currentColor' : 'none'}
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
          <span>{post.likesCount ?? 0}</span>
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
          <span>{post.repliesCount ?? 0}</span>
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
                    {formatDate(reply.createdAt)}
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
