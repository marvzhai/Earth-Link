import pool, { testConnection } from './db.js';

let isInitialized = false;

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
