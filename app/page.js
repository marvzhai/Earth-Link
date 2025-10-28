import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import PostsPage from './components/PostsPage';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🌍</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Earth Link
                </h1>
                <p className="text-xs text-gray-500">Connect with the world</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-gray-900">{posts.length}</div>
                <div className="text-gray-500 text-xs">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">1</div>
                <div className="text-gray-500 text-xs">Users</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Welcome Message (only if no posts) */}
        {posts.length === 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">Welcome to Earth Link! 👋</h2>
            <p className="text-blue-100 text-lg">
              Share your thoughts, ideas, and connect with others. Click the + button to create your first post.
            </p>
          </div>
        )}

        {/* Posts Feed */}
        <PostsPage initialPosts={posts} />
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-3xl text-center text-gray-500 text-sm">
          <p>Built with Next.js, MySQL, and ❤️</p>
        </div>
      </footer>
    </div>
  );
}
