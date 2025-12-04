import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';
import { fetchEventWithMeta } from '@/lib/eventQueries';

// POST /api/events/[id]/rsvps - RSVP to an event
export async function POST(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to RSVP.' },
        { status: 401 }
      );
    }

    // Check event exists
    const [events] = await pool.query('SELECT id FROM events WHERE id = ?', [
      id,
    ]);
    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Insert RSVP (ignore if duplicate)
    await pool.query(
      `INSERT IGNORE INTO event_rsvps (eventId, userId, createdAt) VALUES (?, ?, ?)`,
      [id, currentUser.id, new Date()]
    );

    const event = await fetchEventWithMeta(id, currentUser.id);

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to RSVP', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/rsvps - Remove RSVP from an event
export async function DELETE(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to remove RSVP.' },
        { status: 401 }
      );
    }

    await pool.query(
      `DELETE FROM event_rsvps WHERE eventId = ? AND userId = ?`,
      [id, currentUser.id]
    );

    const event = await fetchEventWithMeta(id, currentUser.id);

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove RSVP', message: error.message },
      { status: 500 }
    );
  }
}

