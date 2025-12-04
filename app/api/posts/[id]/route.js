import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';
import { fetchPostWithMeta } from '@/lib/postQueries';

// GET /api/posts/[id] - Get a single post
export async function GET(request, { params }) {
  try {
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    const post = await fetchPostWithMeta(id, currentUser?.id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
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
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to update posts.' },
        { status: 401 }
      );
    }
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
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPosts[0].authorId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own posts' },
        { status: 403 }
      );
    }

    // Update the post
    await pool.query('UPDATE posts SET body = ? WHERE id = ?', [
      body.trim(),
      id,
    ]);

    const post = await fetchPostWithMeta(id, currentUser.id);

    return NextResponse.json({ post });
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
    await initializeDatabase();
    const { id } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to delete posts.' },
        { status: 401 }
      );
    }

    // Check if post exists
    const [existingPosts] = await pool.query(
      'SELECT id, authorId FROM posts WHERE id = ?',
      [id]
    );

    if (existingPosts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPosts[0].authorId !== currentUser.id) {
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
