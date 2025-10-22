import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';

// GET /api/posts - List all posts
export async function GET() {
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

    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request) {
  try {
    // Initialize database
    await initializeDatabase();

    const { body } = await request.json();

    // Validate input
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return NextResponse.json(
        { error: 'Post body is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Stub auth: always use userId=1
    const userId = 1;
    const createdAt = new Date();

    const [result] = await pool.query(
      'INSERT INTO posts (authorId, body, createdAt) VALUES (?, ?, ?)',
      [userId, body.trim(), createdAt]
    );

    // Fetch the created post with user info
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
      WHERE posts.id = ?
    `, [result.insertId]);

    return NextResponse.json({ post: posts[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post', message: error.message },
      { status: 500 }
    );
  }
}
