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
      <div className="mb-10 flex gap-6 border-b border-stone-200">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-stone-800 text-stone-800'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          All Posts
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`pb-3 text-sm font-medium transition-colors ${
            filter === 'recent'
              ? 'border-b-2 border-stone-800 text-stone-800'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setFilter('popular')}
          className={`pb-3 text-sm font-medium transition-colors ${
            filter === 'popular'
              ? 'border-b-2 border-stone-800 text-stone-800'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Popular
        </button>
      </div>

      {/* Minimal Floating Action Button */}
      <button
        onClick={handleFabClick}
        className="fixed bottom-8 right-8 w-14 h-14 bg-stone-800 text-white rounded-full shadow-lg hover:bg-stone-700 transition-all flex items-center justify-center z-30"
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
