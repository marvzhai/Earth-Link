import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Leaf } from 'lucide-react';

// Mark page as dynamic
export const dynamic = 'force-dynamic';

async function getUserData(userId) {
  try {
    await initializeDatabase();

    const [userRows] = await pool.query(
      'SELECT id, name, handle, createdAt FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const user = userRows[0];

    if (!user) {
      return {
        user: null,
        events: [],
        groups: [],
        memberGroups: [],
        eventReplies: [],
      };
    }

    // Get events created by user
    const [events] = await pool.query(
      `SELECT 
        events.id,
        events.title,
        events.description,
        events.location,
        events.eventTime,
        events.createdAt,
        events.creatorId,
        events.groupId,
        users.handle as creatorHandle,
        users.name as creatorName,
        \`groups\`.name as groupName,
        (SELECT COUNT(*) FROM event_rsvps WHERE event_rsvps.eventId = events.id) AS rsvpCount
      FROM events
      JOIN users ON events.creatorId = users.id
      LEFT JOIN \`groups\` ON events.groupId = \`groups\`.id
      WHERE events.creatorId = ?
      ORDER BY events.eventTime DESC`,
      [userId]
    );

    // Get groups created by user
    const [groups] = await pool.query(
      `SELECT 
        \`groups\`.id,
        \`groups\`.name,
        \`groups\`.location,
        \`groups\`.description,
        \`groups\`.createdAt,
        (SELECT COUNT(*) FROM group_members WHERE group_members.groupId = \`groups\`.id) AS memberCount
      FROM \`groups\`
      WHERE \`groups\`.creatorId = ?
      ORDER BY \`groups\`.createdAt DESC`,
      [userId]
    );

    // Get groups user is a member of (but didn't create)
    const [memberGroups] = await pool.query(
      `SELECT 
        \`groups\`.id,
        \`groups\`.name,
        \`groups\`.location,
        \`groups\`.description,
        \`groups\`.createdAt,
        \`groups\`.creatorId,
        users.name as creatorName,
        users.handle as creatorHandle,
        (SELECT COUNT(*) FROM group_members WHERE group_members.groupId = \`groups\`.id) AS memberCount
      FROM group_members
      JOIN \`groups\` ON group_members.groupId = \`groups\`.id
      JOIN users ON \`groups\`.creatorId = users.id
      WHERE group_members.userId = ? AND \`groups\`.creatorId != ?
      ORDER BY group_members.createdAt DESC`,
      [userId, userId]
    );

    // Get event replies/comments by user
    const [eventReplies] = await pool.query(
      `SELECT 
        event_replies.id,
        event_replies.body,
        event_replies.createdAt,
        event_replies.eventId,
        events.title as eventTitle,
        events.creatorId as eventCreatorId,
        eventCreator.name as eventCreatorName,
        eventCreator.handle as eventCreatorHandle
      FROM event_replies
      JOIN events ON event_replies.eventId = events.id
      JOIN users as eventCreator ON events.creatorId = eventCreator.id
      WHERE event_replies.authorId = ?
      ORDER BY event_replies.createdAt DESC
      LIMIT 20`,
      [userId]
    );

    return {
      user,
      events,
      groups,
      memberGroups,
      eventReplies,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      user: null,
      events: [],
      groups: [],
      memberGroups: [],
      eventReplies: [],
    };
  }
}

const navLinks = [
  { href: '/events', label: 'Events' },
  { href: '/map', label: 'Map' },
  { href: '/groups', label: 'Groups' },
];

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default async function UserProfilePage({ params }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const { id } = await params;
  const profileUserId = parseInt(id, 10);

  // If viewing own profile, redirect to /profile
  if (profileUserId === currentUser.id) {
    redirect('/profile');
  }

  const { user, events, groups, memberGroups, eventReplies } =
    await getUserData(profileUserId);

  if (!user) {
    redirect('/events');
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const allGroups = [...groups, ...memberGroups];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-green-100 text-emerald-950">
      <header className="px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-center gap-4">
            <Link
              href="/events"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white text-2xl"
            >
              <Leaf className="h-7 w-7" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-emerald-900">
                Earth Link
              </h1>
            </div>
            <div className="ml-6 flex items-center gap-2 text-sm text-emerald-700">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  className="rounded-full px-3 py-2 transition hover:bg-emerald-50"
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2 text-sm font-medium text-white shadow ring-1 ring-emerald-400/50 transition hover:shadow-md"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
            Profile
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24 space-y-6">
        {/* Profile Card */}
        <section className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-start gap-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-24 w-24 rounded-2xl object-cover border-2 border-emerald-100 flex-shrink-0"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 text-4xl font-semibold text-white flex-shrink-0">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}

            <div className="flex-1">
              <h2 className="text-3xl font-semibold text-emerald-900">
                {user.name}
              </h2>
              <p className="text-lg text-emerald-600">@{user.handle}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm">
                  <span className="font-semibold text-emerald-900">
                    {events.length}
                  </span>
                  <span className="ml-1 text-emerald-600">events</span>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm">
                  <span className="font-semibold text-emerald-900">
                    {allGroups.length}
                  </span>
                  <span className="ml-1 text-emerald-600">groups</span>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm">
                  <span className="font-semibold text-emerald-900">
                    {eventReplies.length}
                  </span>
                  <span className="ml-1 text-emerald-600">comments</span>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm">
                  <span className="text-emerald-600">Joined</span>
                  <span className="ml-1 font-semibold text-emerald-900">
                    {joinDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Events Section */}
        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-emerald-900">Events</h3>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
              {events.length}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-4xl">📅</div>
              <p className="text-emerald-600">
                {user.name} hasn&apos;t created any events yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const eventDate = new Date(event.eventTime);
                const monthFormatter = new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                });
                const month = monthFormatter.format(eventDate);
                const day = eventDate.getDate();
                const isPast = eventDate.getTime() < Date.now();

                return (
                  <article
                    key={event.id}
                    className={`flex items-start gap-4 rounded-2xl border p-4 transition hover:border-emerald-200 ${
                      isPast
                        ? 'border-stone-200 bg-stone-50/80'
                        : 'border-emerald-100 bg-white/80'
                    }`}
                  >
                    <div
                      className={`flex flex-col items-center rounded-xl px-3 py-2 ${
                        isPast
                          ? 'bg-stone-100 text-stone-500'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wide">
                        {month}
                      </span>
                      <span
                        className={`text-xl font-semibold ${
                          isPast ? 'text-stone-600' : 'text-emerald-900'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-semibold ${
                            isPast ? 'text-stone-700' : 'text-emerald-900'
                          }`}
                        >
                          {event.title}
                        </h4>
                        {isPast && (
                          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600">
                            Past
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-1 text-sm ${
                          isPast ? 'text-stone-500' : 'text-emerald-600'
                        }`}
                      >
                        {event.location || 'Location TBA'}
                        {event.groupName && event.groupId && (
                          <>
                            {' '}
                            ·{' '}
                            <Link
                              href={`/groups?view=${event.groupId}`}
                              className="hover:underline"
                            >
                              {event.groupName}
                            </Link>
                          </>
                        )}
                      </p>
                      {event.rsvpCount > 0 && (
                        <p
                          className={`mt-1 text-xs ${
                            isPast ? 'text-stone-400' : 'text-emerald-500'
                          }`}
                        >
                          {event.rsvpCount}{' '}
                          {event.rsvpCount === 1 ? 'person' : 'people'}{' '}
                          {isPast ? 'attended' : 'going'}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Groups Section */}
        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-emerald-900">Groups</h3>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
              {allGroups.length}
            </span>
          </div>

          {allGroups.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-4xl">🌿</div>
              <p className="text-emerald-600">
                {user.name} hasn&apos;t joined any groups yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Groups they created */}
              {groups.map((group) => (
                <Link
                  key={`created-${group.id}`}
                  href={`/groups?view=${group.id}`}
                  className="rounded-2xl border border-emerald-100 bg-white/80 p-4 transition hover:border-emerald-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 text-sm font-semibold text-white">
                      {group.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-900">
                        {group.name}
                      </h4>
                      <p className="text-xs text-emerald-500">
                        Created by {user.name} · {group.memberCount || 0}{' '}
                        members
                      </p>
                      {group.location && (
                        <p className="mt-1 text-sm text-emerald-600">
                          📍 {group.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Groups they're a member of */}
              {memberGroups.map((group) => (
                <Link
                  key={`member-${group.id}`}
                  href={`/groups?view=${group.id}`}
                  className="rounded-2xl border border-emerald-100 bg-white/80 p-4 transition hover:border-emerald-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-sm font-semibold text-white">
                      {group.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-900">
                        {group.name}
                      </h4>
                      <p className="text-xs text-emerald-500">
                        By{' '}
                        <span
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {group.creatorName}
                        </span>{' '}
                        · {group.memberCount || 0} members
                      </p>
                      {group.location && (
                        <p className="mt-1 text-sm text-emerald-600">
                          📍 {group.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Comments Section */}
        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-emerald-900">Comments</h3>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
              {eventReplies.length}
            </span>
          </div>

          {eventReplies.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-4xl">💬</div>
              <p className="text-emerald-600">
                {user.name} hasn&apos;t commented on any events yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventReplies.map((reply) => (
                <article
                  key={reply.id}
                  className="rounded-2xl border border-emerald-100 bg-white/80 p-4 transition hover:border-emerald-200"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-emerald-600">
                      On{' '}
                      <span className="font-medium text-emerald-800">
                        {reply.eventTitle}
                      </span>{' '}
                      by{' '}
                      <Link
                        href={`/profile/${reply.eventCreatorId}`}
                        className="text-emerald-600 hover:underline"
                      >
                        {reply.eventCreatorName}
                      </Link>
                    </p>
                    <time className="text-xs text-emerald-500">
                      {formatDate(reply.createdAt)}
                    </time>
                  </div>
                  <p className="text-emerald-900 whitespace-pre-wrap">
                    {reply.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
