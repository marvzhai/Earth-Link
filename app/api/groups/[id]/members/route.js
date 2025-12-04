import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';

// GET /api/groups/[id]/members - Get member count and membership status
export async function GET(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    // Check if group exists
    const [groups] = await pool.query('SELECT id FROM `groups` WHERE id = ?', [
      id,
    ]);
    if (groups.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get member count
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM group_members WHERE groupId = ?',
      [id]
    );
    const memberCount = countRows[0]?.count || 0;

    // Check if current user is a member
    let isMember = false;
    if (currentUser) {
      const [memberRows] = await pool.query(
        'SELECT id FROM group_members WHERE groupId = ? AND userId = ?',
        [id, currentUser.id]
      );
      isMember = memberRows.length > 0;
    }

    return NextResponse.json({ memberCount, isMember });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get members', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/members - Join a group
export async function POST(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to join a group.' },
        { status: 401 }
      );
    }

    // Check if group exists
    const [groups] = await pool.query('SELECT id FROM `groups` WHERE id = ?', [
      id,
    ]);
    if (groups.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Join group (ignore if already a member)
    await pool.query(
      'INSERT IGNORE INTO group_members (groupId, userId, createdAt) VALUES (?, ?, ?)',
      [id, currentUser.id, new Date()]
    );

    // Get updated member count
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM group_members WHERE groupId = ?',
      [id]
    );
    const memberCount = countRows[0]?.count || 0;

    return NextResponse.json({ memberCount, isMember: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to join group', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/members - Leave a group
export async function DELETE(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to leave a group.' },
        { status: 401 }
      );
    }

    // Remove membership
    await pool.query(
      'DELETE FROM group_members WHERE groupId = ? AND userId = ?',
      [id, currentUser.id]
    );

    // Get updated member count
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM group_members WHERE groupId = ?',
      [id]
    );
    const memberCount = countRows[0]?.count || 0;

    return NextResponse.json({ memberCount, isMember: false });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to leave group', message: error.message },
      { status: 500 }
    );
  }
}
