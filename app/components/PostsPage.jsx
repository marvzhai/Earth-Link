'use client';

import { useEffect, useMemo, useState } from 'react';
import PostList from './PostList';

export default function PostsPage({ initialPosts, currentUser }) {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState('all'); // all, recent, popular

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
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
       
      </div>
      {/* Posts Feed */}
      <PostList
        posts={filteredPosts}
        onPostDeleted={handlePostDeleted}
        onPostUpdated={handlePostUpdated}
        currentUser={currentUser}
      />
    </>
  );
}
