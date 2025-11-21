'use client';

import { useState } from 'react';
import EventModal from './EventModal';
import EventList from './EventList';

export default function EventsPage({ initialEvents }) {
    const [events, setEvents] = useState(initialEvents || []);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEventCreated = (ev) => {
        setEvents([ev, ...events]);
    };

    const handleEventDeleted = (id) => {
        setEvents(events.filter(e => e.id !== id));
    };

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Events</h2>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-stone-800 text-white rounded">Create Event</button>
            </div>

            <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onEventCreated={handleEventCreated} />

            <EventList events={events} onEventDeleted={handleEventDeleted} />
        </>
    );
}
