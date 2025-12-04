import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/initDb';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { fetchPostWithMeta } from '@/lib/postQueries';

export async function POST(request, { params }) {
  try {
    await initializeDatabase();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to like posts.' },
        { status: 401 }
      );
    }

    const postId = Number(params?.id);
    if (!postId) {
      return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
    }

    await pool.query(
      'INSERT IGNORE INTO post_likes (postId, userId, createdAt) VALUES (?, ?, ?)',
      [postId, currentUser.id, new Date()]
    );

    const post = await fetchPostWithMeta(postId, currentUser.id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to like post', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await initializeDatabase();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to like posts.' },
        { status: 401 }
      );
    }

    const postId = Number(params?.id);
    if (!postId) {
      return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
    }

    await pool.query('DELETE FROM post_likes WHERE postId = ? AND userId = ?', [
      postId,
      currentUser.id,
    ]);

    const post = await fetchPostWithMeta(postId, currentUser.id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to unlike post', message: error.message },
      { status: 500 }
    );
  }
}

