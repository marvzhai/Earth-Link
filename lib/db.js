import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'earthlink',
  password: process.env.DB_PASSWORD || 'earthlink_password',
  database: process.env.DB_NAME || 'earthlink_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection with retry logic (only when needed, not at module load)
let connectionTested = false;

export async function testConnection(retries = 5, delay = 2000) {
  if (connectionTested) return true;

  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ MySQL connection established');
      connection.release();
      connectionTested = true;
      return true;
    } catch (err) {
      console.log(`⏳ Waiting for MySQL... (attempt ${i + 1}/${retries})`);
      if (i === retries - 1) {
        console.error('❌ MySQL connection failed:', err.message);
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

export default pool;
