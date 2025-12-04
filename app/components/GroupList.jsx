'use client';

import { useState } from 'react';
import GroupDetailModal from './GroupDetailModal';
import GroupModal from './GroupModal';

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

export default function GroupList({
  groups,
  onGroupDeleted,
  onGroupUpdated,
  currentUser,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('Delete this group?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      if (onGroupDeleted) onGroupDeleted(id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGroupUpdated = (updatedGroup) => {
    setEditingGroup(null);
    // Also update the selected group if it's being viewed
    if (selectedGroup?.id === updatedGroup.id) {
      setSelectedGroup(updatedGroup);
    }
    onGroupUpdated?.(updatedGroup);
  };

  if (!groups || groups.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-6 text-6xl">🌿</div>
        <h3 className="mb-3 text-2xl font-semibold text-emerald-900">
          No groups yet
        </h3>
        <p className="mx-auto max-w-md text-emerald-600">
          Create a group to bring people together around shared environmental
          interests.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {groups.map((group, index) => {
          const groupImages = Array.isArray(group.images) ? group.images : [];
          const isCreator = currentUser?.id === group.creatorId;

          return (
            <article
              key={group.id}
              className="rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-sm transition hover:border-emerald-200"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Group Avatar/Icon */}
                  {group.iconData ? (
                    <img
                      src={group.iconData}
                      alt={`${group.name} icon`}
                      className="h-12 w-12 rounded-2xl object-cover border border-emerald-100"
                    />
                  ) : (
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${getColor(
                        index
                      )} text-lg font-medium text-white`}
                    >
                      {group.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                  )}

                  <div>
                    <h4 className="text-lg font-semibold text-emerald-900">
                      {group.name}
                    </h4>
                    <p className="text-sm text-emerald-600">
                      {group.memberCount || 0}{' '}
                      {group.memberCount === 1 ? 'member' : 'members'}
                      {group.isMember && (
                        <span className="ml-2 inline-flex items-center gap-1 text-emerald-500">
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                          Joined
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {isCreator && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingGroup(group)}
                      className="rounded-full px-3 py-1 text-xs font-medium text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                      aria-label="Edit group"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      disabled={deletingId === group.id}
                      className="rounded-full px-3 py-1 text-xs font-medium text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                      aria-label="Delete group"
                    >
                      {deletingId === group.id ? (
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Image (if any) */}
              {groupImages.length > 0 && (
                <div className="mb-4 overflow-hidden rounded-2xl border border-emerald-100">
                  <img
                    src={groupImages[0]}
                    alt={`${group.name} preview`}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Location Badge */}
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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
                      d="M17.657 16.657L13.414 12.414a4 4 0 10-1.414 1.414l4.243 4.243a1 1 0 001.414-1.414zM12 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {group.location || 'Location TBA'}
                </div>
              </div>

              {/* Description Preview */}
              {group.description && (
                <p className="mb-4 line-clamp-2 text-emerald-900 leading-relaxed">
                  {group.description}
                </p>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => setSelectedGroup(group)}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-200"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View group
                </button>
                {group.websiteUrl && (
                  <a
                    href={group.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-emerald-600 transition-colors hover:text-emerald-800"
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Website
                  </a>
                )}
                <button className="flex items-center gap-1.5 text-sm text-emerald-600 transition-colors hover:text-emerald-800">
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
                  Share
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Group Detail Modal */}
      <GroupDetailModal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        group={selectedGroup}
        onGroupUpdated={(updatedGroup) => {
          setSelectedGroup(updatedGroup);
          onGroupUpdated?.(updatedGroup);
        }}
      />

      {/* Edit Group Modal */}
      <GroupModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        editGroup={editingGroup}
        onGroupUpdated={handleGroupUpdated}
      />
    </>
  );
}
