'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PostModal from './PostModal';

export default function CreatePostFab({ currentUser }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFabClick = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const handlePostCreated = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={handleFabClick}
        className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-200 transition hover:shadow-xl"
        aria-label="Create post"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
        currentUser={currentUser}
      />
    </>
  );
}

