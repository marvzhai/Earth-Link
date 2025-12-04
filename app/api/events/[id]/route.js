import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';
import { fetchEventWithMeta } from '@/lib/eventQueries';

// GET /api/events/[id] - Get a single event
export async function GET(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    const event = await fetchEventWithMeta(id, currentUser?.id ?? null);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch event', message: error.message },
      { status: 500 }
    );
  }
}

const MAX_IMAGES = 4;
const MAX_IMAGE_MB = 2;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

// PATCH /api/events/[id] - Update an event
export async function PATCH(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to edit events.' },
        { status: 401 }
      );
    }

    const [existing] = await pool.query(
      'SELECT id, creatorId FROM events WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (existing[0].creatorId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      location,
      latitude,
      longitude,
      description,
      eventTime,
      groupId,
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
    const parsedEventTime = new Date(eventTime);
    const cleanLocation = location?.trim() || null;
    const cleanDescription = description?.trim() || null;
    const cleanGroupId = groupId ? Number(groupId) : null;
    const cleanLatitude =
      latitude !== undefined && latitude !== null ? parseFloat(latitude) : null;
    const cleanLongitude =
      longitude !== undefined && longitude !== null
        ? parseFloat(longitude)
        : null;

    await pool.query(
      `UPDATE events SET 
        title = ?, location = ?, latitude = ?, longitude = ?, 
        description = ?, imageData = ?, groupId = ?, eventTime = ?
       WHERE id = ?`,
      [
        title.trim(),
        cleanLocation,
        cleanLatitude,
        cleanLongitude,
        cleanDescription,
        mediaData,
        cleanGroupId,
        parsedEventTime,
        id,
      ]
    );

    const event = await fetchEventWithMeta(id, currentUser.id);

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update event', message: error.message },
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
      return NextResponse.json(
        { error: 'You must be logged in to delete events.' },
        { status: 401 }
      );
    }

    const [existing] = await pool.query(
      'SELECT id, creatorId FROM events WHERE id = ?',
      [id]
    );

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
