import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { createSession, normalizeEmail, verifyPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password?.trim();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    if (!normalizedPassword) {
      return NextResponse.json(
        { error: 'Password is required.' },
        { status: 400 }
      );
    }

    await initializeDatabase();

    const [users] = await pool.query(
      'SELECT id, name, handle, email, passwordHash FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = users[0];
    const isValidPassword = await verifyPassword(normalizedPassword, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        handle: user.handle,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Unable to log in. Please try again.' },
      { status: 500 }
    );
  }
}

