import pool, { testConnection } from './db.js';

let isInitialized = false;

const SEED_POSTS = [
  {
    body: "Just deployed Earth Link with Docker and MySQL! 🚀 The development experience has been amazing so far. Really loving the Next.js App Router.",
    minutesAgo: 5
  },
  {
    body: "Hot take: Server components are a game changer for React applications. The ability to fetch data directly in components without client-side fetching is revolutionary.",
    minutesAgo: 45
  },
  {
    body: "Spent the morning debugging MySQL connection pooling. Turns out the issue was with the healthcheck timing. Always test your Docker services! 🐳",
    minutesAgo: 120
  },
  {
    body: "Anyone else excited about the future of full-stack TypeScript? Next.js + Tailwind + MySQL = 💯",
    minutesAgo: 180
  },
  {
    body: "Pro tip: Use connection pooling with mysql2 for better performance. Don't create a new connection for every query!",
    minutesAgo: 240
  },
  {
    body: "Building in public is scary but rewarding. Shipping Earth Link v1 soon! 🌍",
    minutesAgo: 360
  },
  {
    body: "The best code is no code at all. The second best is simple, readable code that your future self will thank you for.",
    minutesAgo: 480
  },
  {
    body: "Docker Compose makes multi-service development so much easier. Remember when we had to manually start MySQL, Redis, and our app separately? 😅",
    minutesAgo: 600
  }
];

export async function initializeDatabase() {
  // Only initialize once
  if (isInitialized) {
    return;
  }

  try {
    // Test connection first with retries
    await testConnection();

    const connection = await pool.getConnection();

    try {
      // Create users table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          handle VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          createdAt DATETIME NOT NULL,
          INDEX idx_handle (handle)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create posts table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          authorId INT NOT NULL,
          body TEXT NOT NULL,
          createdAt DATETIME NOT NULL,
          FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_author (authorId),
          INDEX idx_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create events table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          creatorId INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          location VARCHAR(255) DEFAULT NULL,
          description TEXT DEFAULT NULL,
          eventTime DATETIME NOT NULL,
          createdAt DATETIME NOT NULL,
          FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_creator (creatorId),
          INDEX idx_eventTime (eventTime)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      /* groups table removed (rollback): previously created here
         The groups feature was rolled back; keep schema unchanged. */

      // Check if demo user exists
      const [rows] = await connection.query('SELECT id FROM users WHERE id = 1');

      if (rows.length === 0) {
        // Create demo user with id=1
        const now = new Date();
        await connection.query(
          'INSERT INTO users (id, handle, name, createdAt) VALUES (?, ?, ?, ?)',
          [1, 'demo', 'Demo User', now]
        );

        console.log('✅ Demo user created with id=1');
      }

      // Check if we need to seed posts
      const [postRows] = await connection.query('SELECT COUNT(*) as count FROM posts');

      if (postRows[0].count === 0) {
        // Seed posts
        console.log('📝 Seeding initial posts...');

        for (const seedPost of SEED_POSTS) {
          const createdAt = new Date(Date.now() - seedPost.minutesAgo * 60 * 1000);
          await connection.query(
            'INSERT INTO posts (authorId, body, createdAt) VALUES (?, ?, ?)',
            [1, seedPost.body, createdAt]
          );
        }

        console.log(`✅ Seeded ${SEED_POSTS.length} demo posts`);
      }

      console.log('✅ Database initialized successfully');
      isInitialized = true;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Don't throw in production, just log the error
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  }
}
