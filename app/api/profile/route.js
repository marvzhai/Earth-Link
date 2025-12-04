import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';

const MAX_AVATAR_MB = 1;
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    await initializeDatabase();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const [users] = await pool.query(
      'SELECT id, name, email, handle, bio, avatarUrl FROM users WHERE id = ?',
      [currentUser.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(request) {
  try {
    await initializeDatabase();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to update your profile.' },
        { status: 401 }
      );
    }

    const { name, bio, avatarUrl } = await request.json();

    // Validate name
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty.' },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: 'Name must be 100 characters or less.' },
          { status: 400 }
        );
      }
    }

    // Validate bio
    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string') {
        return NextResponse.json(
          { error: 'Bio must be a string.' },
          { status: 400 }
        );
      }
      if (bio.length > 500) {
        return NextResponse.json(
          { error: 'Bio must be 500 characters or less.' },
          { status: 400 }
        );
      }
    }

    // Validate avatar
    let cleanAvatarUrl = null;
    if (avatarUrl !== undefined && avatarUrl !== null) {
      if (typeof avatarUrl !== 'string') {
        return NextResponse.json(
          { error: 'Avatar must be a valid image.' },
          { status: 400 }
        );
      }
      const trimmed = avatarUrl.trim();
      if (trimmed && !trimmed.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Avatar must be an image file.' },
          { status: 400 }
        );
      }
      if (trimmed) {
        const base64Length = trimmed.split(',')[1]?.length || 0;
        const approxBytes = (base64Length * 3) / 4;
        if (approxBytes > MAX_AVATAR_BYTES) {
          return NextResponse.json(
            { error: `Avatar must be smaller than ${MAX_AVATAR_MB}MB.` },
            { status: 400 }
          );
        }
        cleanAvatarUrl = trimmed;
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio?.trim() || null);
    }
    if (avatarUrl !== undefined) {
      updates.push('avatarUrl = ?');
      values.push(cleanAvatarUrl);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update.' },
        { status: 400 }
      );
    }

    values.push(currentUser.id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user
    const [users] = await pool.query(
      'SELECT id, name, email, handle, bio, avatarUrl FROM users WHERE id = ?',
      [currentUser.id]
    );

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', message: error.message },
      { status: 500 }
    );
  }
}

