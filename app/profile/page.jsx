import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

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
      return { user: null, postCount: 0, posts: [] };
    }

    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE authorId = ?',
      [userId]
    );
    const countRow = countRows[0] || { count: 0 };

    const [posts] = await pool.query(
      `SELECT 
        posts.id,
        posts.body,
        posts.createdAt,
        posts.authorId,
        users.handle as authorHandle,
        users.name as authorName
      FROM posts
      JOIN users ON posts.authorId = users.id
      WHERE posts.authorId = ?
      ORDER BY posts.createdAt DESC`,
      [userId]
    );

    return {
      user,
      postCount: countRow.count,
      posts,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { user: null, postCount: 0, posts: [] };
  }
}

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const { user, postCount, posts } = await getUserData(currentUser.id);

  if (!user) {
    redirect('/');
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const navLinks = [
    { href: '/', label: 'Feed' },
    { href: '/events', label: 'Events' },
    { href: '/groups', label: 'Groups' },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="container mx-auto px-6 py-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-70 transition-opacity"
              >
                <span className="text-3xl">🌍</span>
                <h1 className="text-2xl font-semibold text-stone-800">
                  Earth Link
                </h1>
              </Link>

              <div className="flex items-center gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 text-sm rounded-md text-stone-700 hover:bg-stone-100"
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
                  className="px-3 py-2 text-sm text-stone-500 hover:text-stone-800"
                >
                  Log out
                </button>
              </form>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-stone-700 bg-stone-100"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm font-medium">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="bg-white border border-stone-200 rounded-lg p-12 mb-8">
          <div className="flex items-start gap-8">
            <div className="w-24 h-24 rounded-full bg-stone-600 flex items-center justify-center text-white font-semibold text-3xl flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-semibold text-stone-800 mb-2">
                {user.name}
              </h2>
              <p className="text-stone-500 mb-2">@{user.handle}</p>
              <p className="text-sm text-stone-500">{user.email}</p>

              <div className="flex gap-8 text-sm mt-6">
                <div>
                  <span className="font-semibold text-stone-800">
                    {postCount}
                  </span>
                  <span className="text-stone-500 ml-1">posts</span>
                </div>
                <div>
                  <span className="font-semibold text-stone-800">Joined</span>
                  <span className="text-stone-500 ml-1">{joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-stone-800 mb-6">
            Posts ({postCount})
          </h3>

          {posts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-stone-200 rounded-lg">
              <div className="text-6xl mb-6">📝</div>
              <p className="text-stone-600">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white border border-stone-200 rounded-lg p-8"
                >
                  <div className="text-sm text-stone-500 mb-4">
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-stone-700 leading-relaxed whitespace-pre-wrap break-words">
                    {post.body}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-32 py-8 border-t border-stone-200">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex items-center justify-between text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌍</span>
              <span>Earth Link</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-stone-800 transition-colors">
                About
              </a>
              <a href="#" className="hover:text-stone-800 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-stone-800 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-stone-800 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
