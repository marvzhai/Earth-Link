import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';

// POST /api/auth/change-password - Change user's password
export async function POST(request) {
  try {
    await initializeDatabase();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'You must be logged in to change your password.' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // Get current password hash
    const [users] = await pool.query(
      'SELECT passwordHash FROM users WHERE id = ?',
      [currentUser.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, users[0].passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect.' },
        { status: 400 }
      );
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(newPassword);
    await pool.query('UPDATE users SET passwordHash = ? WHERE id = ?', [
      newPasswordHash,
      currentUser.id,
    ]);

    return NextResponse.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to change password', message: error.message },
      { status: 500 }
    );
  }
}

