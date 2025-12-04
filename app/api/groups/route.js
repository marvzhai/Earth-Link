import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';

const MAX_IMAGES = 4;
const MAX_IMAGE_MB = 2;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

// GET /api/groups - List all groups
export async function GET() {
  try {
    await initializeDatabase();
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id ?? -1;

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
        users.name as creatorName,
        (SELECT COUNT(*) FROM group_members WHERE group_members.groupId = \`groups\`.id) AS memberCount,
        (SELECT COUNT(*) FROM group_members WHERE group_members.groupId = \`groups\`.id AND group_members.userId = ?) > 0 AS isMember
      FROM \`groups\`
      JOIN users ON \`groups\`.creatorId = users.id
      ORDER BY \`groups\`.createdAt DESC
    `,
      [userId]
    );

    // Parse imageData for each group
    const parsedGroups = groups.map((group) => ({
      ...group,
      images: parseStoredImages(group.imageData),
      memberCount: Number(group.memberCount) || 0,
      isMember: Boolean(Number(group.isMember)),
    }));

    return NextResponse.json({ groups: parsedGroups });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch groups', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request) {
  try {
    await initializeDatabase();

    const { name, location, description, websiteUrl, icon, images } =
      await request.json();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to create a group.' },
        { status: 401 }
      );
    }

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
    const cleanLocation = location?.trim() || null;
    const cleanDescription = description?.trim() || null;
    const cleanWebsiteUrl = websiteUrl?.trim() || null;

    const [result] = await pool.query(
      'INSERT INTO `groups` (creatorId, name, location, description, websiteUrl, iconData, imageData, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        name.trim(),
        cleanLocation,
        cleanDescription,
        cleanWebsiteUrl,
        cleanIcon,
        mediaData,
        createdAt,
      ]
    );

    // Automatically add creator as a member
    await pool.query(
      'INSERT INTO group_members (groupId, userId, createdAt) VALUES (?, ?, ?)',
      [result.insertId, userId, createdAt]
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
      [result.insertId]
    );

    const group = rows[0];
    group.images = parseStoredImages(group.imageData);
    group.memberCount = 1; // Creator is automatically a member
    group.isMember = true;

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create group', message: error.message },
      { status: 500 }
    );
  }
}

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
