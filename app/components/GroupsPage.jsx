'use client';

import { useState } from 'react';
import GroupModal from './GroupModal';
import GroupList from './GroupList';

export default function GroupsPage({ initialGroups }) {
    const [groups, setGroups] = useState(initialGroups || []);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleGroupCreated = (g) => setGroups([g, ...groups]);
    const handleGroupDeleted = (id) => setGroups(groups.filter(gg => gg.id !== id));

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Groups</h2>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-stone-800 text-white rounded">Create Group</button>
            </div>

            <GroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onGroupCreated={handleGroupCreated} />

            <GroupList groups={groups} onGroupDeleted={handleGroupDeleted} />
        </>
    );
}
