import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';

// GET /api/events - List all events
export async function GET() {
    try {
        await initializeDatabase();

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
      ORDER BY events.eventTime ASC
    `);

        return NextResponse.json({ events });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch events', message: error.message },
            { status: 500 }
        );
    }
}

// POST /api/events - Create a new event
export async function POST(request) {
    try {
        await initializeDatabase();

        const { title, location, description, eventTime } = await request.json();
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'You must be logged in to create an event.' },
                { status: 401 }
            );
        }

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        if (!eventTime || isNaN(new Date(eventTime).getTime())) {
            return NextResponse.json({ error: 'Valid eventTime is required' }, { status: 400 });
        }

        const userId = currentUser.id;
        const createdAt = new Date();
        const parsedEventTime = new Date(eventTime);
        const cleanLocation = location?.trim() || null;
        const cleanDescription = description?.trim() || null;

        const [result] = await pool.query(
            'INSERT INTO events (creatorId, title, location, description, eventTime, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, title.trim(), cleanLocation, cleanDescription, parsedEventTime, createdAt]
        );

        const [rows] = await pool.query(`
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
    `, [result.insertId]);

        return NextResponse.json({ event: rows[0] }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create event', message: error.message },
            { status: 500 }
        );
    }
}
