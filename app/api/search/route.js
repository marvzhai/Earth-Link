import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';

// GET /api/search?q=query&type=events|groups - Search events and/or groups
export async function GET(request) {
  try {
    await initializeDatabase();
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id ?? -1;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type'); // 'events', 'groups', or null for both

    if (!query || query.length < 2) {
      return NextResponse.json({
        events: [],
        groups: [],
      });
    }

    const searchPattern = `%${query}%`;
    let events = [];
    let groups = [];

    // Search events if type is 'events' or not specified
    if (!type || type === 'events') {
      const [eventRows] = await pool.query(
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
        LIMIT 20`,
        [searchPattern, searchPattern, searchPattern]
      );
      events = eventRows.map((e) => ({
        ...e,
        rsvpCount: Number(e.rsvpCount) || 0,
      }));
    }

    // Search groups if type is 'groups' or not specified
    if (!type || type === 'groups') {
      const [groupRows] = await pool.query(
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
        LIMIT 20`,
        [userId, searchPattern, searchPattern, searchPattern]
      );
      groups = groupRows.map((g) => ({
        ...g,
        memberCount: Number(g.memberCount) || 0,
        isMember: Boolean(Number(g.isMember)),
      }));
    }

    return NextResponse.json({ events, groups });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search', message: error.message },
      { status: 500 }
    );
  }
}
