import { fetchAllEventsWithMeta, mapEventRow } from './eventQueries.js';

/**
 * Fetch events feed sorted by createdAt descending.
 * Each item has a `type` field ('event') for rendering.
 */
export async function fetchEventsFeed(currentUserId = null) {
  const events = await fetchAllEventsWithMeta(currentUserId);
  return events;
}

export { mapEventRow };
