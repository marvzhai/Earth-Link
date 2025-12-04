import pool from './db.js';
import { parseStoredImages } from './postQueries.js';

export function mapEventRow(row) {
  const likesCountRaw = row.likesCount ?? row.likes_count ?? row.likeCount ?? 0;
  const repliesCountRaw =
    row.repliesCount ?? row.replies_count ?? row.replyCount ?? 0;
  const rsvpCountRaw = row.rsvpCount ?? row.rsvp_count ?? 0;
  const likedRaw =
    row.likedByCurrentUser ?? row.liked_by_current_user ?? row.likedByUser ?? 0;
  const rsvpdRaw =
    row.rsvpdByCurrentUser ?? row.rsvpd_by_current_user ?? row.rsvpdByUser ?? 0;

  return {
    id: row.id,
    type: 'event',
    title: row.title,
    description: row.description,
    location: row.location,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    eventTime: row.eventTime ?? row.event_time,
    rsvpLink: row.rsvpLink ?? row.rsvp_link ?? null,
    imageData: row.imageData ?? row.image_data ?? null,
    images: parseStoredImages(row.imageData ?? row.image_data),
    createdAt: row.createdAt ?? row.created_at,
    creatorId: row.creatorId ?? row.creator_id,
    creatorHandle: row.creatorHandle ?? row.creator_handle,
    creatorName: row.creatorName ?? row.creator_name,
    groupId: row.groupId ?? row.group_id ?? null,
    groupName: row.groupName ?? row.group_name ?? null,
    likesCount: Number(likesCountRaw) || 0,
    repliesCount: Number(repliesCountRaw) || 0,
    rsvpCount: Number(rsvpCountRaw) || 0,
    likedByCurrentUser:
      typeof likedRaw === 'boolean' ? likedRaw : Boolean(Number(likedRaw) || 0),
    rsvpdByCurrentUser:
      typeof rsvpdRaw === 'boolean' ? rsvpdRaw : Boolean(Number(rsvpdRaw) || 0),
  };
}

const EVENTS_BASE_FIELDS = `
  SELECT 
    events.id,
    events.title,
    events.description,
    events.location,
    events.latitude,
    events.longitude,
    events.eventTime,
    events.rsvpLink,
    events.imageData,
    events.createdAt,
    events.creatorId,
    events.groupId,
    users.handle as creatorHandle,
    users.name as creatorName,
    \`groups\`.name as groupName,
    (SELECT COUNT(*) FROM event_likes WHERE event_likes.eventId = events.id) AS likesCount,
    (SELECT COUNT(*) FROM event_replies WHERE event_replies.eventId = events.id) AS repliesCount,
    (SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.eventId = events.id) AS rsvpCount,
    (
      SELECT COUNT(*) 
      FROM event_likes 
      WHERE event_likes.eventId = events.id 
        AND event_likes.userId = COALESCE(?, -1)
    ) > 0 AS likedByCurrentUser,
    (
      SELECT COUNT(*) 
      FROM event_rsvps 
      WHERE event_rsvps.eventId = events.id 
        AND event_rsvps.userId = COALESCE(?, -1)
    ) > 0 AS rsvpdByCurrentUser
  FROM events
  JOIN users ON events.creatorId = users.id
  LEFT JOIN \`groups\` ON events.groupId = \`groups\`.id
`;

export async function fetchAllEventsWithMeta(currentUserId = null) {
  const userParam = currentUserId ?? null;
  const [rows] = await pool.query(
    `
      ${EVENTS_BASE_FIELDS}
      ORDER BY events.createdAt DESC
    `,
    [userParam, userParam]
  );
  return rows.map(mapEventRow);
}

export async function fetchEventWithMeta(eventId, currentUserId = null) {
  const userParam = currentUserId ?? null;
  const [rows] = await pool.query(
    `
      ${EVENTS_BASE_FIELDS}
      WHERE events.id = ?
    `,
    [userParam, userParam, eventId]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapEventRow(rows[0]);
}
