import bcrypt from 'bcryptjs';
import pool, { testConnection } from './db.js';

let isInitialized = false;

const SEED_POSTS = [
  {
    body: 'Just deployed Earth Link with Docker and MySQL! 🚀 The development experience has been amazing so far. Really loving the Next.js App Router.',
    minutesAgo: 5,
  },
  {
    body: 'Hot take: Server components are a game changer for React applications. The ability to fetch data directly in components without client-side fetching is revolutionary.',
    minutesAgo: 45,
  },
  {
    body: 'Spent the morning debugging MySQL connection pooling. Turns out the issue was with the healthcheck timing. Always test your Docker services! 🐳',
    minutesAgo: 120,
  },
  {
    body: 'Anyone else excited about the future of full-stack TypeScript? Next.js + Tailwind + MySQL = 💯',
    minutesAgo: 180,
  },
  {
    body: "Pro tip: Use connection pooling with mysql2 for better performance. Don't create a new connection for every query!",
    minutesAgo: 240,
  },
  {
    body: 'Building in public is scary but rewarding. Shipping Earth Link v1 soon! 🌍',
    minutesAgo: 360,
  },
  {
    body: 'The best code is no code at all. The second best is simple, readable code that your future self will thank you for.',
    minutesAgo: 480,
  },
  {
    body: 'Docker Compose makes multi-service development so much easier. Remember when we had to manually start MySQL, Redis, and our app separately? 😅',
    minutesAgo: 600,
  },
];

const DEMO_EMAIL = 'demo@earth.link';
const DEMO_PASSWORD = 'password123';

async function columnExists(connection, table, column) {
  // Remove backticks for information_schema query (needs plain table name)
  const plainTableName = table.replace(/`/g, '');
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
    [plainTableName, column]
  );
  return rows.length > 0;
}

async function ensureColumn(connection, table, column, definition) {
  const exists = await columnExists(connection, table, column);
  if (!exists) {
    // Use table with backticks for ALTER TABLE (handles reserved keywords)
    const quotedTable = table.includes('`') ? table : `\`${table}\``;
    await connection.query(
      `ALTER TABLE ${quotedTable} ADD COLUMN ${definition}`
    );
  }
}

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
          email VARCHAR(255) UNIQUE,
          passwordHash VARCHAR(255),
          bio TEXT DEFAULT NULL,
          avatarUrl VARCHAR(512) DEFAULT NULL,
          createdAt DATETIME NOT NULL,
          INDEX idx_handle (handle)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Ensure new columns exist for older databases
      await ensureColumn(
        connection,
        'users',
        'email',
        'email VARCHAR(255) DEFAULT NULL'
      );
      await ensureColumn(
        connection,
        'users',
        'passwordHash',
        'passwordHash VARCHAR(255) DEFAULT NULL'
      );
      await ensureColumn(connection, 'users', 'bio', 'bio TEXT DEFAULT NULL');
      await ensureColumn(
        connection,
        'users',
        'avatarUrl',
        'avatarUrl VARCHAR(512) DEFAULT NULL'
      );

      // Ensure unique index on email
      const [emailIndex] = await connection.query(`
        SELECT 1 FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
          AND table_name = 'users' 
          AND index_name = 'idx_users_email'
        LIMIT 1
      `);

      if (emailIndex.length === 0) {
        await connection.query(
          'CREATE UNIQUE INDEX idx_users_email ON users (email)'
        );
      }

      // Create posts table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          authorId INT NOT NULL,
          body TEXT NOT NULL,
          imageData LONGTEXT DEFAULT NULL,
          createdAt DATETIME NOT NULL,
          FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_author (authorId),
          INDEX idx_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await ensureColumn(
        connection,
        'posts',
        'imageData',
        'imageData LONGTEXT DEFAULT NULL'
      );

      await connection.query(`
        CREATE TABLE IF NOT EXISTS post_likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          postId INT NOT NULL,
          userId INT NOT NULL,
          createdAt DATETIME NOT NULL,
          UNIQUE KEY uniq_post_user (postId, userId),
          FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_post_likes_post (postId),
          INDEX idx_post_likes_user (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS post_replies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          postId INT NOT NULL,
          authorId INT NOT NULL,
          body TEXT NOT NULL,
          createdAt DATETIME NOT NULL,
          FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_post_replies_post (postId),
          INDEX idx_post_replies_author (authorId),
          INDEX idx_post_replies_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create events table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          creatorId INT NOT NULL,
          groupId INT DEFAULT NULL,
          title VARCHAR(255) NOT NULL,
          location VARCHAR(255) DEFAULT NULL,
          description TEXT DEFAULT NULL,
          imageData LONGTEXT DEFAULT NULL,
          rsvpLink VARCHAR(512) DEFAULT NULL,
          eventTime DATETIME NOT NULL,
          createdAt DATETIME NOT NULL,
          FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_creator (creatorId),
          INDEX idx_eventTime (eventTime)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Ensure new event columns exist for older databases
      await ensureColumn(
        connection,
        'events',
        'groupId',
        'groupId INT DEFAULT NULL'
      );
      await ensureColumn(
        connection,
        'events',
        'imageData',
        'imageData LONGTEXT DEFAULT NULL'
      );
      await ensureColumn(
        connection,
        'events',
        'rsvpLink',
        'rsvpLink VARCHAR(512) DEFAULT NULL'
      );

      // Create event_rsvps table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS event_rsvps (
          id INT AUTO_INCREMENT PRIMARY KEY,
          eventId INT NOT NULL,
          userId INT NOT NULL,
          createdAt DATETIME NOT NULL,
          UNIQUE KEY uniq_event_user (eventId, userId),
          FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_event_rsvps_event (eventId),
          INDEX idx_event_rsvps_user (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create event_likes table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS event_likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          eventId INT NOT NULL,
          userId INT NOT NULL,
          createdAt DATETIME NOT NULL,
          UNIQUE KEY uniq_event_like (eventId, userId),
          FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_event_likes_event (eventId),
          INDEX idx_event_likes_user (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create event_replies table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS event_replies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          eventId INT NOT NULL,
          authorId INT NOT NULL,
          body TEXT NOT NULL,
          createdAt DATETIME NOT NULL,
          FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_event_replies_event (eventId),
          INDEX idx_event_replies_author (authorId),
          INDEX idx_event_replies_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create groups table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`groups\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          creatorId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255) DEFAULT NULL,
          description TEXT DEFAULT NULL,
          websiteUrl VARCHAR(512) DEFAULT NULL,
          iconData LONGTEXT DEFAULT NULL,
          imageData LONGTEXT DEFAULT NULL,
          createdAt DATETIME NOT NULL,
          FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_groups_creator (creatorId),
          INDEX idx_groups_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Ensure new group columns exist for older databases
      await ensureColumn(
        connection,
        '`groups`',
        'websiteUrl',
        'websiteUrl VARCHAR(512) DEFAULT NULL'
      );
      await ensureColumn(
        connection,
        '`groups`',
        'iconData',
        'iconData LONGTEXT DEFAULT NULL'
      );
      await ensureColumn(
        connection,
        '`groups`',
        'imageData',
        'imageData LONGTEXT DEFAULT NULL'
      );

      // Create sessions table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          token CHAR(64) NOT NULL UNIQUE,
          createdAt DATETIME NOT NULL,
          expiresAt DATETIME NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_session_token (token),
          INDEX idx_session_expires (expiresAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Check if demo user exists
      const [rows] = await connection.query(
        'SELECT id FROM users WHERE id = 1'
      );

      if (rows.length === 0) {
        // Create demo user with id=1
        const now = new Date();
        const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
        await connection.query(
          'INSERT INTO users (id, handle, name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          [1, 'demo', 'Demo User', DEMO_EMAIL, passwordHash, now]
        );

        console.log('✅ Demo user created with id=1');
      } else {
        const [demoRows] = await connection.query(
          'SELECT email, passwordHash FROM users WHERE id = 1'
        );
        const demoUser = demoRows[0];
        const needsEmail = !demoUser?.email;
        const needsPassword = !demoUser?.passwordHash;
        if (needsEmail || needsPassword) {
          const passwordHash = needsPassword
            ? await bcrypt.hash(DEMO_PASSWORD, 10)
            : demoUser.passwordHash;
          await connection.query(
            'UPDATE users SET email = COALESCE(email, ?), passwordHash = ? WHERE id = 1',
            [DEMO_EMAIL, passwordHash]
          );
        }
      }

      // Check if we need to seed posts
      const [postRows] = await connection.query(
        'SELECT COUNT(*) as count FROM posts'
      );

      if (postRows[0].count === 0) {
        // Seed posts
        console.log('📝 Seeding initial posts...');

        for (const seedPost of SEED_POSTS) {
          const createdAt = new Date(
            Date.now() - seedPost.minutesAgo * 60 * 1000
          );
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
