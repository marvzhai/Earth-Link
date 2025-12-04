import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';

// GET /api/search?q=query - Search events, groups, and users
export async function GET(request) {
  try {
    await initializeDatabase();
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id ?? -1;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        events: [],
        groups: [],
        users: [],
      });
    }

    const searchPattern = `%${query}%`;

    // Search events
    const [events] = await pool.query(
      `SELECT 
        events.id,
        events.title,
        events.description,
        events.location,
        events.eventTime,
        events.creatorId,
        users.name as creatorName,
        users.handle as creatorHandle,
        \`groups\`.name as groupName,
        (SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.eventId = events.id) AS rsvpCount
      FROM events
      JOIN users ON events.creatorId = users.id
      LEFT JOIN \`groups\` ON events.groupId = \`groups\`.id
      WHERE events.title LIKE ? 
         OR events.description LIKE ? 
         OR events.location LIKE ?
      ORDER BY events.eventTime DESC
      LIMIT 10`,
      [searchPattern, searchPattern, searchPattern]
    );

    // Search groups
    const [groups] = await pool.query(
      `SELECT 
        \`groups\`.id,
        \`groups\`.name,
        \`groups\`.description,
        \`groups\`.location,
        \`groups\`.iconData,
        users.name as creatorName,
        (SELECT COUNT(*) FROM group_members WHERE group_members.groupId = \`groups\`.id) AS memberCount,
        (SELECT COUNT(*) FROM group_members WHERE group_members.groupId = \`groups\`.id AND group_members.userId = ?) > 0 AS isMember
      FROM \`groups\`
      JOIN users ON \`groups\`.creatorId = users.id
      WHERE \`groups\`.name LIKE ? 
         OR \`groups\`.description LIKE ? 
         OR \`groups\`.location LIKE ?
      ORDER BY \`groups\`.createdAt DESC
      LIMIT 10`,
      [userId, searchPattern, searchPattern, searchPattern]
    );

    // Search users
    const [users] = await pool.query(
      `SELECT 
        id,
        name,
        handle,
        bio,
        avatarUrl
      FROM users
      WHERE name LIKE ? 
         OR handle LIKE ?
      ORDER BY name ASC
      LIMIT 10`,
      [searchPattern, searchPattern]
    );

    return NextResponse.json({
      events: events.map((e) => ({
        ...e,
        rsvpCount: Number(e.rsvpCount) || 0,
      })),
      groups: groups.map((g) => ({
        ...g,
        memberCount: Number(g.memberCount) || 0,
        isMember: Boolean(Number(g.isMember)),
      })),
      users,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search', message: error.message },
      { status: 500 }
    );
  }
}

