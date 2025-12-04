import pool from './db.js';

export function parseStoredImages(imageData) {
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
          (value) => typeof value === 'string' && value.startsWith('data:image/')
        );
      }
    } catch (error) {
      if (imageData.startsWith('data:image/')) {
        return [imageData];
      }
    }
  }

  return [];
}

export function mapPostRow(row) {
  const likesCountRaw =
    row.likesCount ?? row.likes_count ?? row.likeCount ?? 0;
  const repliesCountRaw =
    row.repliesCount ?? row.replies_count ?? row.replyCount ?? 0;
  const likedRaw =
    row.likedByCurrentUser ??
    row.liked_by_current_user ??
    row.likedByUser ??
    0;

  return {
    id: row.id,
    body: row.body,
    imageData: row.imageData ?? row.image_data ?? null,
    images: parseStoredImages(row.imageData ?? row.image_data),
    createdAt: row.createdAt ?? row.created_at,
    authorId: row.authorId ?? row.author_id,
    authorHandle: row.authorHandle ?? row.author_handle,
    authorName: row.authorName ?? row.author_name,
    likesCount: Number(likesCountRaw) || 0,
    repliesCount: Number(repliesCountRaw) || 0,
    likedByCurrentUser:
      typeof likedRaw === 'boolean'
        ? likedRaw
        : Boolean(Number(likedRaw) || 0),
  };
}

const POSTS_BASE_FIELDS = `
  SELECT 
    posts.id,
    posts.body,
    posts.imageData,
    posts.createdAt,
    posts.authorId,
    users.handle as authorHandle,
    users.name as authorName,
    (SELECT COUNT(*) FROM post_likes WHERE post_likes.postId = posts.id) AS likesCount,
    (SELECT COUNT(*) FROM post_replies WHERE post_replies.postId = posts.id) AS repliesCount,
    (
      SELECT COUNT(*) 
      FROM post_likes 
      WHERE post_likes.postId = posts.id 
        AND post_likes.userId = COALESCE(?, -1)
    ) > 0 AS likedByCurrentUser
  FROM posts
  JOIN users ON posts.authorId = users.id
`;

export async function fetchAllPostsWithMeta(currentUserId = null) {
  const userParam = currentUserId ?? null;
  const [rows] = await pool.query(
    `
      ${POSTS_BASE_FIELDS}
      ORDER BY posts.createdAt DESC
    `,
    [userParam]
  );
  return rows.map(mapPostRow);
}

export async function fetchPostWithMeta(postId, currentUserId = null) {
  const userParam = currentUserId ?? null;
  const [rows] = await pool.query(
    `
      ${POSTS_BASE_FIELDS}
      WHERE posts.id = ?
    `,
    [userParam, postId]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapPostRow(rows[0]);
}

