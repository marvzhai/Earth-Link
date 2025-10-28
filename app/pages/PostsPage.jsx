'use client';

import { useState } from 'react';
import PostForm from '../components/PostForm';
import PostList from '../components/PostList';

export default function PostsPage({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts);

  const handlePostCreated = (newPost) => {
    // Add new post to the beginning of the list
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  return (
    <>
      {/* Post Form */}
      <PostForm onPostCreated={handlePostCreated} />

      {/* Post List */}
      <PostList posts={posts} onPostDeleted={handlePostDeleted} />
    </>
  );
}

