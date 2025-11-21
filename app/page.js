import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import PostsPage from './components/PostsPage';
import Link from 'next/link';

// Mark page as dynamic to avoid build-time database access
export const dynamic = 'force-dynamic';

async function getPosts() {
  try {
    // Initialize database
    await initializeDatabase();

    const [posts] = await pool.query(`
      SELECT 
        posts.id,
        posts.body,
        posts.createdAt,
        posts.authorId,
        users.handle as authorHandle,
        users.name as authorName
      FROM posts
      JOIN users ON posts.authorId = users.id
      ORDER BY posts.createdAt DESC
    `);

    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="container mx-auto px-6 py-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <span className="text-3xl">🌍</span>
                <h1 className="text-2xl font-semibold text-stone-800">Earth Link</h1>
              </Link>

              {/* Left nav buttons */}
              <div className="flex items-center gap-2">
                <Link href="/" className="px-3 py-2 text-sm rounded-md text-stone-700 hover:bg-stone-100">Feed</Link>
                <Link href="/events" className="px-3 py-2 text-sm rounded-md text-stone-700 hover:bg-stone-100">Events</Link>
                <Link href="/groups" className="px-3 py-2 text-sm rounded-md text-stone-700 hover:bg-stone-100">Groups</Link>
              </div>
            </div>

            {/* Profile Link */}
            <Link href="/profile" className="flex items-center gap-2 px-4 py-2 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Welcome Message (only if no posts) */}
        {posts.length === 0 && (
          <div className="mb-16 text-center py-20">
            <div className="text-6xl mb-6">🌱</div>
            <h2 className="text-3xl font-semibold text-stone-800 mb-4">
              Welcome to Earth Link
            </h2>
            <p className="text-lg text-stone-600 max-w-xl mx-auto">
              Share your thoughts and connect with the community. Click the +
              button to create your first post.
            </p>
          </div>
        )}

        {/* Posts Feed */}
        <PostsPage initialPosts={posts} />
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
