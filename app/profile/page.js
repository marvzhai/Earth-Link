import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import Link from 'next/link';

// Mark page as dynamic
export const dynamic = 'force-dynamic';

async function getUserData() {
  try {
    await initializeDatabase();

    // Get user info
    const [users] = await pool.query('SELECT * FROM users LIMIT 1');
    const user = users[0];

    // Get user's post count
    const [postCount] = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE authorId = ?',
      [user.id]
    );

    // Get user's posts
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
      [user.id]
    );

    return {
      user,
      postCount: postCount[0].count,
      posts
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      user: null,
      postCount: 0,
      posts: []
    };
  }
}

export default async function ProfilePage() {
  const { user, postCount, posts } = await getUserData();

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600">User not found</p>
          <Link href="/" className="text-stone-800 underline mt-4 inline-block">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="container mx-auto px-6 py-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <span className="text-3xl">🌍</span>
              <h1 className="text-2xl font-semibold text-stone-800">
                Earth Link
              </h1>
            </Link>

            {/* Profile Link */}
            <Link 
              href="/profile" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-stone-700 bg-stone-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Profile Header */}
        <div className="bg-white border border-stone-200 rounded-lg p-12 mb-8">
          <div className="flex items-start gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-stone-600 flex items-center justify-center text-white font-semibold text-3xl flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-semibold text-stone-800 mb-2">
                {user.name}
              </h2>
              <p className="text-stone-500 mb-6">@{user.handle}</p>

              {/* Stats */}
              <div className="flex gap-8 text-sm">
                <div>
                  <span className="font-semibold text-stone-800">{postCount}</span>
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

        {/* Posts Section */}
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
                      minute: '2-digit'
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

      {/* Footer */}
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
