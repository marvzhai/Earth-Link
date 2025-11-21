import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';

// GET /api/groups - List all groups
export async function GET() {
    try {
        await initializeDatabase();

        const [groups] = await pool.query(`
      SELECT
        groups.id,
        groups.name,
        groups.location,
        groups.description,
        groups.createdAt,
        groups.creatorId,
        users.handle as creatorHandle,
        users.name as creatorName
      FROM groups
      JOIN users ON groups.creatorId = users.id
      ORDER BY groups.createdAt DESC
    `);

        return NextResponse.json({ groups });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch groups', message: error.message },
            { status: 500 }
        );
    }
}

// POST /api/groups - Create a new group
export async function POST(request) {
    try {
        await initializeDatabase();

        const { name, location, description } = await request.json();

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        // Stub auth: userId = 1
        const userId = 1;
        const createdAt = new Date();

        const [result] = await pool.query(
            'INSERT INTO groups (creatorId, name, location, description, createdAt) VALUES (?, ?, ?, ?, ?)',
            [userId, name.trim(), location || null, description || null, createdAt]
        );

        const [rows] = await pool.query(`
      SELECT
        groups.id,
        groups.name,
        groups.location,
        groups.description,
        groups.createdAt,
        groups.creatorId,
        users.handle as creatorHandle,
        users.name as creatorName
      FROM groups
      JOIN users ON groups.creatorId = users.id
      WHERE groups.id = ?
    `, [result.insertId]);

        return NextResponse.json({ group: rows[0] }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create group', message: error.message },
            { status: 500 }
        );
    }
}
