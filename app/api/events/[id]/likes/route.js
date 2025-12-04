import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';
import { fetchEventWithMeta } from '@/lib/eventQueries';

// POST /api/events/[id]/likes - Like an event
export async function POST(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to like events.' },
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

    // Insert like (ignore if duplicate)
    await pool.query(
      `INSERT IGNORE INTO event_likes (eventId, userId, createdAt) VALUES (?, ?, ?)`,
      [id, currentUser.id, new Date()]
    );

    const event = await fetchEventWithMeta(id, currentUser.id);

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to like event', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/likes - Unlike an event
export async function DELETE(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to unlike events.' },
        { status: 401 }
      );
    }

    await pool.query(`DELETE FROM event_likes WHERE eventId = ? AND userId = ?`, [
      id,
      currentUser.id,
    ]);

    const event = await fetchEventWithMeta(id, currentUser.id);

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to unlike event', message: error.message },
      { status: 500 }
    );
  }
}

