'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import GroupModal from './GroupModal';
import GroupList from './GroupList';

export default function GroupsPage({ initialGroups, currentUser }) {
  const [groups, setGroups] = useState(initialGroups || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setGroups(initialGroups || []);
  }, [initialGroups]);

  const handleGroupCreated = (group) => setGroups([group, ...groups]);
  const handleGroupDeleted = (id) =>
    setGroups(groups.filter((group) => group.id !== id));
  const handleGroupUpdated = (updatedGroup) =>
    setGroups(groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));

  const handleCreateClick = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-500">
            Connect locally
          </p>
          <h2 className="text-2xl font-semibold text-emerald-900">
            Community Groups
          </h2>
          <p className="text-sm text-emerald-600">
            Join or create groups to collaborate on sustainability projects.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
        >
          <svg
            className="mr-2 h-4 w-4"
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
          Create group
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <span className="rounded-full border border-emerald-100 px-4 py-2 text-sm text-emerald-700">
          {groups.length} {groups.length === 1 ? 'group' : 'groups'}
        </span>
      </div>

      <GroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      <GroupList
        groups={groups}
        onGroupDeleted={handleGroupDeleted}
        onGroupUpdated={handleGroupUpdated}
        currentUser={currentUser}
      />
    </>
  );
}
