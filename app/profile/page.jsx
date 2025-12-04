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

    const [posts] = await pool.query(
      `SELECT 
        posts.id,
        posts.body,
        posts.imageData,
        posts.createdAt,
        posts.authorId,
        users.handle as authorHandle,
        users.name as authorName
      FROM posts
      JOIN users ON posts.authorId = users.id
      WHERE posts.authorId = ?
      ORDER BY posts.createdAt DESC
      LIMIT 10`,
      [userId]
    );

    return {
      user,
      postCount: postCountRows[0]?.count || 0,
      eventCount: eventCountRows[0]?.count || 0,
      groupCount: groupCountRows[0]?.count || 0,
      posts,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      user: null,
      postCount: 0,
      eventCount: 0,
      groupCount: 0,
      posts: [],
    };
  }
}

const formatRelativeDate = (dateString) => {
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
};

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const { user, postCount, eventCount, groupCount, posts } = await getUserData(
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
      {/* Header */}
      <header className="px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white text-2xl">
              <Leaf className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-emerald-900">
                Earth Link
              </h1>
            </div>
            <div className="ml-6 flex items-center gap-2 text-sm text-emerald-700">
              <Link
                className="rounded-full px-3 py-2 transition hover:bg-emerald-50"
                href="/"
              >
                Feed
              </Link>
              <Link
                className="rounded-full px-3 py-2 transition hover:bg-emerald-50"
                href="/events"
              >
                Events
              </Link>
              <Link
                className="rounded-full px-3 py-2 transition hover:bg-emerald-50"
                href="/groups"
              >
                Groups
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-full px-3 py-2 text-sm text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                Log out
              </button>
            </form>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-200"
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
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-lime-500 text-4xl font-semibold text-white shadow-lg shadow-emerald-200">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-3xl font-semibold text-emerald-900">
                {user.name}
              </h2>
              <p className="mt-1 text-emerald-600">@{user.handle}</p>
              <p className="mt-1 text-sm text-emerald-500">{user.email}</p>

              {user.bio && <p className="mt-4 text-emerald-800">{user.bio}</p>}

              {/* Stats */}
              <div className="mt-6 flex flex-wrap justify-center gap-6 sm:justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2">
                  <svg
                    className="h-4 w-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span className="font-semibold text-emerald-900">
                    {postCount}
                  </span>
                  <span className="text-sm text-emerald-600">posts</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2">
                  <svg
                    className="h-4 w-4 text-emerald-600"
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
                  <span className="font-semibold text-emerald-900">
                    {eventCount}
                  </span>
                  <span className="text-sm text-emerald-600">events</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2">
                  <svg
                    className="h-4 w-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-semibold text-emerald-900">
                    {groupCount}
                  </span>
                  <span className="text-sm text-emerald-600">groups</span>
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

        {/* Recent Posts */}
        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-emerald-900">
              Recent Posts
            </h3>
            <span className="rounded-full border border-emerald-100 px-3 py-1 text-sm text-emerald-600">
              {postCount} total
            </span>
          </div>

          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-6 text-6xl">🌱</div>
              <h4 className="mb-3 text-xl font-semibold text-emerald-900">
                No posts yet
              </h4>
              <p className="mx-auto max-w-md text-emerald-600">
                Share your thoughts with the community by creating your first
                post!
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create your first post
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <article
                  key={post.id}
                  className="rounded-2xl border border-emerald-100 bg-white/95 p-5 transition hover:border-emerald-200"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${
                        index % 2 === 0
                          ? 'from-emerald-500 to-green-500'
                          : 'from-lime-400 to-emerald-500'
                      } text-sm font-medium text-white`}
                    >
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <span className="font-medium text-emerald-900">
                        {user.name}
                      </span>
                      <span>·</span>
                      <time dateTime={post.createdAt}>
                        {formatRelativeDate(post.createdAt)}
                      </time>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-emerald-900">
                    {post.body}
                  </p>
                </article>
              ))}

              {postCount > 10 && (
                <div className="pt-4 text-center">
                  <Link
                    href="/"
                    className="text-sm font-medium text-emerald-600 transition hover:text-emerald-800"
                  >
                    View all posts →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
