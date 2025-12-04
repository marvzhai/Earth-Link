import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';
import { fetchAllPostsWithMeta, fetchPostWithMeta } from '@/lib/postQueries';

const MAX_IMAGES = 4;
const MAX_IMAGE_MB = 2;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

// GET /api/posts - List all posts
export async function GET() {
  try {
    // Initialize database
    await initializeDatabase();

    const currentUser = await getCurrentUser();
    const posts = await fetchAllPostsWithMeta(currentUser?.id);

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

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to create a post.' },
        { status: 401 }
      );
    }

    const { body, imageData, images } = await request.json();
    const trimmedBody = body?.trim();

    // Validate input
    if (
      !trimmedBody ||
      typeof trimmedBody !== 'string' ||
      trimmedBody.length === 0
    ) {
      return NextResponse.json(
        { error: 'Post body is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const incomingImages = Array.isArray(images)
      ? images
      : imageData
      ? [imageData]
      : [];

    if (incomingImages.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_IMAGES} images per post.` },
        { status: 400 }
      );
    }

    const sanitizedImages = [];

    for (const image of incomingImages) {
      if (typeof image !== 'string') {
        return NextResponse.json(
          { error: 'Each image must be a base64 encoded string.' },
          { status: 400 }
        );
      }

      const trimmed = image.trim();
      if (!trimmed.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Only image files are supported.' },
          { status: 400 }
        );
      }

      const base64Length = trimmed.split(',')[1]?.length || 0;
      const approxBytes = (base64Length * 3) / 4;
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `Images must be smaller than ${MAX_IMAGE_MB}MB.` },
          { status: 400 }
        );
      }

      sanitizedImages.push(trimmed);
    }

    const mediaData =
      sanitizedImages.length > 0 ? JSON.stringify(sanitizedImages) : null;

    const createdAt = new Date();

    const [result] = await pool.query(
      'INSERT INTO posts (authorId, body, imageData, createdAt) VALUES (?, ?, ?, ?)',
      [currentUser.id, trimmedBody, mediaData, createdAt]
    );

    const post = await fetchPostWithMeta(result.insertId, currentUser.id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found after creation' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post', message: error.message },
      { status: 500 }
    );
  }
}
