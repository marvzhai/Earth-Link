'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GroupModal from './GroupModal';
import GroupList from './GroupList';

export default function GroupsPage({ initialGroups, currentUser }) {
    const [groups, setGroups] = useState(initialGroups || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleGroupCreated = (group) => setGroups([group, ...groups]);
    const handleGroupDeleted = (id) => setGroups(groups.filter((group) => group.id !== id));

    const handleCreateClick = () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Groups</h2>
                <button onClick={handleCreateClick} className="px-4 py-2 bg-stone-800 text-white rounded">
                    Create Group
                </button>
            </div>

            <GroupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onGroupCreated={handleGroupCreated}
            />

            <GroupList groups={groups} onGroupDeleted={handleGroupDeleted} currentUser={currentUser} />
        </>
    );
}
