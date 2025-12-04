import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';

const MAX_IMAGES = 4;
const MAX_IMAGE_MB = 2;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

function parseStoredImages(imageData) {
  if (!imageData) {
    return [];
  }

  if (Array.isArray(imageData)) {
    return imageData.filter(
      (value) => typeof value === 'string' && value.startsWith('data:image/')
    );
  }

  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (value) =>
            typeof value === 'string' && value.startsWith('data:image/')
        );
      }
    } catch {
      if (imageData.startsWith('data:image/')) {
        return [imageData];
      }
    }
  }

  return [];
}

// GET /api/groups/[id] - Get a single group
export async function GET(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;

    const [groups] = await pool.query(
      `
      SELECT
        \`groups\`.id,
        \`groups\`.name,
        \`groups\`.location,
        \`groups\`.description,
        \`groups\`.websiteUrl,
        \`groups\`.iconData,
        \`groups\`.imageData,
        \`groups\`.createdAt,
        \`groups\`.creatorId,
        users.handle as creatorHandle,
        users.name as creatorName
      FROM \`groups\`
      JOIN users ON \`groups\`.creatorId = users.id
      WHERE \`groups\`.id = ?
    `,
      [id]
    );

    if (groups.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = groups[0];
    group.images = parseStoredImages(group.imageData);

    return NextResponse.json({ group });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch group', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id] - Update a group
export async function PATCH(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to edit groups.' },
        { status: 401 }
      );
    }

    const [existing] = await pool.query(
      'SELECT id, creatorId FROM `groups` WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (existing[0].creatorId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Only the creator can edit this group.' },
        { status: 403 }
      );
    }

    const { name, location, description, websiteUrl, icon, images } =
      await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // Validate icon
    let cleanIcon = null;
    if (icon && typeof icon === 'string') {
      const trimmedIcon = icon.trim();
      if (trimmedIcon.startsWith('data:image/')) {
        const base64Length = trimmedIcon.split(',')[1]?.length || 0;
        const approxBytes = (base64Length * 3) / 4;
        if (approxBytes <= MAX_IMAGE_BYTES) {
          cleanIcon = trimmedIcon;
        }
      }
    }

    // Validate images
    const incomingImages = Array.isArray(images) ? images : [];
    if (incomingImages.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_IMAGES} images per group.` },
        { status: 400 }
      );
    }

    const sanitizedImages = [];
    for (const image of incomingImages) {
      if (typeof image !== 'string') continue;
      const trimmed = image.trim();
      if (!trimmed.startsWith('data:image/')) continue;
      const base64Length = trimmed.split(',')[1]?.length || 0;
      const approxBytes = (base64Length * 3) / 4;
      if (approxBytes <= MAX_IMAGE_BYTES) {
        sanitizedImages.push(trimmed);
      }
    }

    const mediaData =
      sanitizedImages.length > 0 ? JSON.stringify(sanitizedImages) : null;

    const cleanLocation = location?.trim() || null;
    const cleanDescription = description?.trim() || null;
    const cleanWebsiteUrl = websiteUrl?.trim() || null;

    await pool.query(
      `UPDATE \`groups\` 
       SET name = ?, location = ?, description = ?, websiteUrl = ?, iconData = ?, imageData = ?
       WHERE id = ?`,
      [
        name.trim(),
        cleanLocation,
        cleanDescription,
        cleanWebsiteUrl,
        cleanIcon,
        mediaData,
        id,
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT
        \`groups\`.id,
        \`groups\`.name,
        \`groups\`.location,
        \`groups\`.description,
        \`groups\`.websiteUrl,
        \`groups\`.iconData,
        \`groups\`.imageData,
        \`groups\`.createdAt,
        \`groups\`.creatorId,
        users.handle as creatorHandle,
        users.name as creatorName
      FROM \`groups\`
      JOIN users ON \`groups\`.creatorId = users.id
      WHERE \`groups\`.id = ?
    `,
      [id]
    );

    const group = rows[0];
    group.images = parseStoredImages(group.imageData);

    return NextResponse.json({ group });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update group', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Delete a group
export async function DELETE(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to delete groups.' },
        { status: 401 }
      );
    }

    const [existing] = await pool.query(
      'SELECT id, creatorId FROM `groups` WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (existing[0].creatorId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pool.query('DELETE FROM `groups` WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete group', message: error.message },
      { status: 500 }
    );
  }
}
