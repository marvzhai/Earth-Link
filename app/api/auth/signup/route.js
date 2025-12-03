import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import {
  createSession,
  generateUniqueHandle,
  hashPassword,
  normalizeEmail,
} from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    const normalizedName = name?.trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password?.trim();

    if (!normalizedName || normalizedName.length < 2) {
      return NextResponse.json(
        { error: 'Please provide your full name.' },
        { status: 400 }
      );
    }

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!normalizedPassword || normalizedPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await initializeDatabase();

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const handle = await generateUniqueHandle(normalizedName, normalizedEmail);
    const passwordHash = await hashPassword(normalizedPassword);
    const createdAt = new Date();

    const [result] = await pool.query(
      'INSERT INTO users (handle, name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)',
      [handle, normalizedName, normalizedEmail, passwordHash, createdAt]
    );

    await createSession(result.insertId);

    return NextResponse.json(
      {
        user: {
          id: result.insertId,
          name: normalizedName,
          handle,
          email: normalizedEmail,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Unable to create account. Please try again.' },
      { status: 500 }
    );
  }
}

