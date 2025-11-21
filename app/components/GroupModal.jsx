'use client';

import { useState, useEffect } from 'react';

export default function GroupModal({ isOpen, onClose, onGroupCreated }) {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) { setError('Group name is required'); return; }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), location: location.trim(), description: description.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create group');
            onGroupCreated(data.group);
            setName(''); setLocation(''); setDescription('');
            onClose();
        } catch (err) {
            setError(err.message);
        } finally { setIsSubmitting(false); }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Create Group</h3>
                        <button onClick={onClose} className="text-stone-400 hover:text-stone-700">✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-stone-600">Group Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 border rounded" />
                        </div>

                        <div>
                            <label className="block text-sm text-stone-600">Location</label>
                            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full mt-1 p-2 border rounded" />
                        </div>

                        <div>
                            <label className="block text-sm text-stone-600">Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full mt-1 p-2 border rounded" />
                        </div>

                        {error && <div className="text-sm text-red-600">{error}</div>}

                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded border">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-stone-800 text-white rounded">{isSubmitting ? 'Creating...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
