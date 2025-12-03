'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import EventModal from './EventModal';
import EventList from './EventList';

export default function EventsPage({ initialEvents, currentUser }) {
    const [events, setEvents] = useState(initialEvents || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleEventCreated = (ev) => {
        setEvents([ev, ...events]);
    };

    const handleEventDeleted = (id) => {
        setEvents(events.filter(e => e.id !== id));
    };

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
                <h2 className="text-2xl font-semibold">Events</h2>
                <button onClick={handleCreateClick} className="px-4 py-2 bg-stone-800 text-white rounded">
                    Create Event
                </button>
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onEventCreated={handleEventCreated}
            />

            <EventList events={events} onEventDeleted={handleEventDeleted} currentUser={currentUser} />
        </>
    );
}
