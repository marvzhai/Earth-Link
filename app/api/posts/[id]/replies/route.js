import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/initDb';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { fetchPostWithMeta } from '@/lib/postQueries';

const MAX_REPLY_CHARS = 280;

export async function GET(request, { params }) {
  try {
    await initializeDatabase();
    const currentUser = await getCurrentUser();
    const postId = Number(params?.id);

    if (!postId) {
      return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
    }

    const post = await fetchPostWithMeta(postId, currentUser?.id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const [rows] = await pool.query(
      `
        SELECT 
          post_replies.id,
          post_replies.body,
          post_replies.createdAt,
          post_replies.authorId,
          users.name AS authorName,
          users.handle AS authorHandle
        FROM post_replies
        JOIN users ON post_replies.authorId = users.id
        WHERE post_replies.postId = ?
        ORDER BY post_replies.createdAt ASC
      `,
      [postId]
    );

    return NextResponse.json({ replies: rows, post });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load replies', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    await initializeDatabase();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to reply.' },
        { status: 401 }
      );
    }

    const postId = Number(params?.id);
    if (!postId) {
      return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
    }

    const { body } = await request.json();
    const trimmed = body?.trim();

    if (!trimmed) {
      return NextResponse.json(
        { error: 'Reply cannot be empty.' },
        { status: 400 }
      );
    }

    if (trimmed.length > MAX_REPLY_CHARS) {
      return NextResponse.json(
        { error: `Replies are limited to ${MAX_REPLY_CHARS} characters.` },
        { status: 400 }
      );
    }

    const createdAt = new Date();
    const [result] = await pool.query(
      `
        INSERT INTO post_replies (postId, authorId, body, createdAt)
        VALUES (?, ?, ?, ?)
      `,
      [postId, currentUser.id, trimmed, createdAt]
    );

    const [rows] = await pool.query(
      `
        SELECT 
          post_replies.id,
          post_replies.body,
          post_replies.createdAt,
          post_replies.authorId,
          users.name AS authorName,
          users.handle AS authorHandle
        FROM post_replies
        JOIN users ON post_replies.authorId = users.id
        WHERE post_replies.id = ?
      `,
      [result.insertId]
    );

    const reply = rows[0];
    const post = await fetchPostWithMeta(postId, currentUser.id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ reply, post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add reply', message: error.message },
      { status: 500 }
    );
  }
}

