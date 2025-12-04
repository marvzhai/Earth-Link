import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import pool from './db.js';

const SESSION_COOKIE_NAME = 'earthlink_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    email: row.email,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
  };
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const [rows] = await pool.query(
    `
      SELECT 
        users.id,
        users.name,
        users.handle,
        users.email,
        users.bio,
        users.avatarUrl,
        users.createdAt,
        sessions.expiresAt
      FROM sessions
      JOIN users ON sessions.userId = users.id
      WHERE sessions.token = ?
    `,
    [token]
  );

  if (rows.length === 0) {
    return null;
  }

  const session = rows[0];
  if (new Date(session.expiresAt) < new Date()) {
    await pool.query('DELETE FROM sessions WHERE token = ?', [token]);
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return sanitizeUser(session);
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await pool.query(
    'INSERT INTO sessions (userId, token, createdAt, expiresAt) VALUES (?, ?, ?, ?)',
    [userId, token, createdAt, expiresAt]
  );

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

export async function destroySession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await pool.query('DELETE FROM sessions WHERE token = ?', [token]);
  }

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
}

export function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

export function normalizeHandle(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}

export async function generateUniqueHandle(name, fallbackEmail) {
  const base =
    normalizeHandle(name) ||
    normalizeHandle(fallbackEmail?.split('@')[0]) ||
    'earthling';

  let handle = base || 'earthling';
  let suffix = 1;

  while (true) {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE handle = ?',
      [handle]
    );
    if (existing.length === 0) {
      return handle;
    }
    handle = `${base}${suffix}`;
    suffix += 1;
  }
}
