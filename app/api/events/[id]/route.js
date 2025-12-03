import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';

// GET /api/events/[id] - Get a single event
export async function GET(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;

    const [events] = await pool.query(`
      SELECT
        events.id,
        events.title,
        events.location,
        events.description,
        events.eventTime,
        events.createdAt,
        events.creatorId,
        users.handle as creatorHandle,
        users.name as creatorName
      FROM events
      JOIN users ON events.creatorId = users.id
      WHERE events.id = ?
    `, [id]);

    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event: events[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch event', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'You must be logged in to delete events.' }, { status: 401 });
    }

    const [existing] = await pool.query('SELECT id, creatorId FROM events WHERE id = ?', [id]);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (existing[0].creatorId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pool.query('DELETE FROM events WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete event', message: error.message },
      { status: 500 }
    );
  }
}
