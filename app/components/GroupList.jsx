'use client';

import { useState } from 'react';

export default function GroupList({ groups, onGroupDeleted }) {
    const [deletingId, setDeletingId] = useState(null);

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
        } finally { setDeletingId(null); }
    };

    if (!groups || groups.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-6">🫂</div>
                <h3 className="text-2xl font-semibold text-stone-800 mb-3">No groups yet</h3>
                <p className="text-stone-600 max-w-md mx-auto">Create a group to start connecting.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {groups.map(g => (
                <article key={g.id} className="bg-white border border-stone-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h4 className="text-lg font-semibold text-stone-800">{g.name}</h4>
                            <div className="text-sm text-stone-500 mt-1">{g.creatorName ? `${g.creatorName} @${g.creatorHandle}` : 'Creator'}</div>
                        </div>

                        <button onClick={() => handleDelete(g.id)} disabled={deletingId === g.id} className="text-stone-400 hover:text-stone-700 transition-colors">
                            {deletingId === g.id ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>

                    <div className="text-sm text-stone-600 mb-3">
                        <strong>Location:</strong> {g.location || 'TBA'}
                    </div>

                    {g.description && <div className="text-stone-700 whitespace-pre-wrap">{g.description}</div>}
                </article>
            ))}
        </div>
    );
}
