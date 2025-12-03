'use client';

import { useState } from 'react';

export default function EventList({ events, onEventDeleted, currentUser }) {
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = async (id) => {
        if (!confirm('Delete this event?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            if (onEventDeleted) onEventDeleted(id);
        } catch (err) {
            alert(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-6">📅</div>
                <h3 className="text-2xl font-semibold text-stone-800 mb-3">No events yet</h3>
                <p className="text-stone-600 max-w-md mx-auto">Create an event to get started.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {events.map((ev) => (
                <article key={ev.id} className="bg-white border border-stone-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h4 className="text-lg font-semibold text-stone-800">{ev.title}</h4>
                            <div className="text-sm text-stone-500 mt-1">{ev.creatorName ? `${ev.creatorName} @${ev.creatorHandle}` : 'Host'}</div>
                        </div>

                        {currentUser?.id === ev.creatorId && (
                            <button
                                onClick={() => handleDelete(ev.id)}
                                disabled={deletingId === ev.id}
                                className="text-stone-400 hover:text-stone-700 transition-colors"
                            >
                                {deletingId === ev.id ? 'Deleting...' : 'Delete'}
                            </button>
                        )}
                    </div>

                    <div className="text-sm text-stone-600 mb-3">
                        <strong>When:</strong> {new Date(ev.eventTime).toLocaleString()}
                        <span className="mx-3">•</span>
                        <strong>Where:</strong> {ev.location || 'TBA'}
                    </div>

                    {ev.description && (
                        <div className="text-stone-700 whitespace-pre-wrap">{ev.description}</div>
                    )}
                </article>
            ))}
        </div>
    );
}
