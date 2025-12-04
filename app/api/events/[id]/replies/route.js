import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';
import { fetchEventWithMeta } from '@/lib/eventQueries';

const MAX_REPLY_CHARS = 280;

// GET /api/events/[id]/replies - Get replies for an event
export async function GET(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    // Check event exists
    const [events] = await pool.query('SELECT id FROM events WHERE id = ?', [
      id,
    ]);
    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const [replies] = await pool.query(
      `
        SELECT 
          event_replies.id,
          event_replies.body,
          event_replies.createdAt,
          event_replies.authorId,
          users.handle as authorHandle,
          users.name as authorName
        FROM event_replies
        JOIN users ON event_replies.authorId = users.id
        WHERE event_replies.eventId = ?
        ORDER BY event_replies.createdAt ASC
      `,
      [id]
    );

    const event = await fetchEventWithMeta(id, currentUser?.id ?? null);

    return NextResponse.json({ replies, event });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch replies', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/replies - Add a reply to an event
export async function POST(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to reply.' },
        { status: 401 }
      );
    }

    const { body } = await request.json();
    const trimmed = body?.trim();

    if (!trimmed || trimmed.length === 0) {
      return NextResponse.json(
        { error: 'Reply body is required.' },
        { status: 400 }
      );
    }

    if (trimmed.length > MAX_REPLY_CHARS) {
      return NextResponse.json(
        { error: `Reply exceeds ${MAX_REPLY_CHARS} characters.` },
        { status: 400 }
      );
    }

    // Check event exists
    const [events] = await pool.query('SELECT id FROM events WHERE id = ?', [
      id,
    ]);
    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const createdAt = new Date();

    const [result] = await pool.query(
      `INSERT INTO event_replies (eventId, authorId, body, createdAt) VALUES (?, ?, ?, ?)`,
      [id, currentUser.id, trimmed, createdAt]
    );

    const [replyRows] = await pool.query(
      `
        SELECT 
          event_replies.id,
          event_replies.body,
          event_replies.createdAt,
          event_replies.authorId,
          users.handle as authorHandle,
          users.name as authorName
        FROM event_replies
        JOIN users ON event_replies.authorId = users.id
        WHERE event_replies.id = ?
      `,
      [result.insertId]
    );

    const event = await fetchEventWithMeta(id, currentUser.id);

    return NextResponse.json({ reply: replyRows[0], event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add reply', message: error.message },
      { status: 500 }
    );
  }
}

