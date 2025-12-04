import { fetchAllPostsWithMeta, mapPostRow } from './postQueries.js';
import { fetchAllEventsWithMeta, mapEventRow } from './eventQueries.js';

/**
 * Fetch combined feed of posts and events, sorted by createdAt descending.
 * Each item has a `type` field ('post' or 'event') for rendering.
 */
export async function fetchCombinedFeed(currentUserId = null) {
  const [posts, events] = await Promise.all([
    fetchAllPostsWithMeta(currentUserId),
    fetchAllEventsWithMeta(currentUserId),
  ]);

  // Mark posts with type
  const taggedPosts = posts.map((post) => ({ ...post, type: 'post' }));
  // Events already have type: 'event' from mapEventRow

  // Merge and sort by createdAt descending
  const combined = [...taggedPosts, ...events].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return combined;
}

export { mapPostRow, mapEventRow };
