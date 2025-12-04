'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import PostModal from './PostModal';
import PostList from './PostList';

export default function PostsPage({ initialPosts, currentUser }) {
  const [posts, setPosts] = useState(initialPosts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, recent, popular
  const router = useRouter();

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handleFabClick = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const filteredPosts = useMemo(() => {
    if (filter === 'recent') {
      return [...posts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return posts;
  }, [filter, posts]);

  return (
    <>
      {/* Simple Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          All Posts
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === 'recent'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setFilter('popular')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === 'popular'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Popular
        </button>
      </div>

      {/* Minimal Floating Action Button */}
      <button
        onClick={handleFabClick}
        className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-200 transition hover:shadow-xl"
        aria-label="Create post"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Post Modal */}
      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
        currentUser={currentUser}
      />

      {/* Posts Feed */}
      <PostList
        posts={filteredPosts}
        onPostDeleted={handlePostDeleted}
        currentUser={currentUser}
      />
    </>
  );
}
