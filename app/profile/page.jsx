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
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const user = userRows[0];

    if (!user) {
      return {
        user: null,
        postCount: 0,
        eventCount: 0,
        groupCount: 0,
        posts: [],
      };
    }

    const [postCountRows] = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE authorId = ?',
      [userId]
    );

    const [eventCountRows] = await pool.query(
      'SELECT COUNT(*) as count FROM events WHERE creatorId = ?',
      [userId]
    );

    const [groupCountRows] = await pool.query(
      'SELECT COUNT(*) as count FROM `groups` WHERE creatorId = ?',
      [userId]
    );

    const [groupCountRows] = await pool.query(
      'SELECT COUNT(*) as count FROM `groups` WHERE creatorId = ?',
      [userId]
    );
    const groupCount = groupCountRows[0]?.count || 0;

    const [events] = await pool.query(
      `SELECT 
        events.id,
        events.title,
        events.description,
        events.location,
        events.eventTime,
        events.createdAt,
        events.creatorId,
        users.handle as creatorHandle,
        users.name as creatorName
      FROM events
      JOIN users ON events.creatorId = users.id
      WHERE events.creatorId = ?
      ORDER BY events.eventTime DESC`,
      [userId]
    );

    return {
      user,
      eventCount,
      groupCount,
      events,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { user: null, eventCount: 0, groupCount: 0, events: [] };
  }
}

const navLinks = [
  { href: '/', label: 'Feed' },
  { href: '/groups', label: 'Groups' },
];

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const { user, eventCount, groupCount, events } = await getUserData(
    currentUser.id
  );

  if (!user) {
    redirect('/');
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-green-100 text-emerald-950">
      <header className="px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-center gap-4">
            <Link
              href="/"
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

          <div className="flex items-center gap-3">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-full px-4 py-2 text-sm text-emerald-600 transition hover:bg-emerald-50"
              >
                Log out
              </button>
            </form>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm transition"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-500 text-xs font-semibold text-white">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
              </span>
              Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        {/* Profile Card */}
        <section className="mb-8 rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 text-3xl font-semibold text-white flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-emerald-900">
                {user.name}
              </h2>
              <p className="text-emerald-600">@{user.handle}</p>
              <p className="mt-1 text-sm text-emerald-500">{user.email}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="rounded-2xl bg-emerald-50 px-4 py-2">
                  <span className="font-semibold text-emerald-900">
                    {eventCount}
                  </span>
                  <span className="ml-1 text-emerald-600">events</span>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-2">
                  <span className="font-semibold text-emerald-900">
                    {groupCount}
                  </span>
                  <span className="ml-1 text-emerald-600">groups</span>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-2">
                  <span className="text-emerald-600">Joined</span>
                  <span className="ml-1 font-semibold text-emerald-900">
                    {joinDate}
                  </span>
                </div>
              </div>

              {/* Join date */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-500 sm:justify-start">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Joined {joinDate}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Your Events */}
        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <h3 className="mb-6 text-xl font-semibold text-emerald-900">
            Your Events ({eventCount})
          </h3>

          {events.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-4 text-5xl">🌱</div>
              <p className="text-emerald-600">
                You haven&apos;t created any events yet.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
              >
                Create your first event
              </Link>
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

                return (
                  <article
                    key={event.id}
                    className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white/80 p-4 transition hover:border-emerald-200"
                  >
                    <div className="flex flex-col items-center rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                      <span className="text-xs uppercase tracking-wide">
                        {month}
                      </span>
                      <span className="text-xl font-semibold text-emerald-900">
                        {day}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-900">
                        {event.title}
                      </h4>
                      <p className="mt-1 text-sm text-emerald-600">
                        {event.location || 'Location TBA'}
                      </p>
                      {event.description && (
                        <p className="mt-2 text-sm text-emerald-700 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
