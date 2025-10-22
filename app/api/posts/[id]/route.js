import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/posts/[id] - Get a single post
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
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
    `, [id]);

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: posts[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch post', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id] - Update a post
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { body } = await request.json();

    // Validate input
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return NextResponse.json(
        { error: 'Post body is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if post exists
    const [existingPosts] = await pool.query(
      'SELECT id, authorId FROM posts WHERE id = ?',
      [id]
    );
    
    if (existingPosts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Stub auth: verify user owns the post (userId=1)
    if (existingPosts[0].authorId !== 1) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own posts' },
        { status: 403 }
      );
    }

    // Update the post
    await pool.query(
      'UPDATE posts SET body = ? WHERE id = ?',
      [body.trim(), id]
    );

    // Fetch the updated post
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
    `, [id]);

    return NextResponse.json({ post: posts[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update post', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Check if post exists
    const [existingPosts] = await pool.query(
      'SELECT id, authorId FROM posts WHERE id = ?',
      [id]
    );
    
    if (existingPosts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Stub auth: verify user owns the post (userId=1)
    if (existingPosts[0].authorId !== 1) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete the post
    await pool.query('DELETE FROM posts WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete post', message: error.message },
      { status: 500 }
    );
  }
}
