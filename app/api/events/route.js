import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';
import { fetchAllEventsWithMeta, fetchEventWithMeta } from '@/lib/eventQueries';

const MAX_IMAGES = 4;
const MAX_IMAGE_MB = 2;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

// GET /api/events - List all events
export async function GET() {
  try {
    await initializeDatabase();
    const currentUser = await getCurrentUser();
    const events = await fetchAllEventsWithMeta(currentUser?.id ?? null);
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

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to create an event.' },
        { status: 401 }
      );
    }

    const {
      title,
      location,
      description,
      eventTime,
      groupId,
      rsvpLink,
      images,
    } = await request.json();

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!eventTime || isNaN(new Date(eventTime).getTime())) {
      return NextResponse.json(
        { error: 'Valid eventTime is required' },
        { status: 400 }
      );
    }

    // Validate images
    const incomingImages = Array.isArray(images) ? images : [];
    if (incomingImages.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_IMAGES} images per event.` },
        { status: 400 }
      );
    }

    const sanitizedImages = [];
    for (const image of incomingImages) {
      if (typeof image !== 'string') {
        return NextResponse.json(
          { error: 'Each image must be a base64 encoded string.' },
          { status: 400 }
        );
      }
      const trimmed = image.trim();
      if (!trimmed.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Only image files are supported.' },
          { status: 400 }
        );
      }
      const base64Length = trimmed.split(',')[1]?.length || 0;
      const approxBytes = (base64Length * 3) / 4;
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `Images must be smaller than ${MAX_IMAGE_MB}MB.` },
          { status: 400 }
        );
      }
      sanitizedImages.push(trimmed);
    }

    const mediaData =
      sanitizedImages.length > 0 ? JSON.stringify(sanitizedImages) : null;

    const userId = currentUser.id;
    const createdAt = new Date();
    const parsedEventTime = new Date(eventTime);
    const cleanLocation = location?.trim() || null;
    const cleanDescription = description?.trim() || null;
    const cleanRsvpLink = rsvpLink?.trim() || null;
    const cleanGroupId = groupId ? Number(groupId) : null;

    const [result] = await pool.query(
      `INSERT INTO events 
        (creatorId, groupId, title, location, description, imageData, rsvpLink, eventTime, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        cleanGroupId,
        title.trim(),
        cleanLocation,
        cleanDescription,
        mediaData,
        cleanRsvpLink,
        parsedEventTime,
        createdAt,
      ]
    );

    // Automatically RSVP the creator to their own event
    await pool.query(
      'INSERT INTO event_rsvps (eventId, userId, createdAt) VALUES (?, ?, ?)',
      [result.insertId, userId, createdAt]
    );

    const event = await fetchEventWithMeta(result.insertId, currentUser.id);

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create event', message: error.message },
      { status: 500 }
    );
  }
}
