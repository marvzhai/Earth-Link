import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';

// GET /api/groups/[id] - Get a single group
export async function GET(request, { params }) {
    try {
        await initializeDatabase();
        const { id } = params;

        const [groups] = await pool.query(`
      SELECT
        \`groups\`.id,
        \`groups\`.name,
        \`groups\`.location,
        \`groups\`.description,
        \`groups\`.createdAt,
        \`groups\`.creatorId,
        users.handle as creatorHandle,
        users.name as creatorName
      FROM \`groups\`
      JOIN users ON \`groups\`.creatorId = users.id
      WHERE \`groups\`.id = ?
    `, [id]);

        if (groups.length === 0) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        return NextResponse.json({ group: groups[0] });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch group', message: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/groups/[id] - Delete a group
export async function DELETE(request, { params }) {
    try {
        await initializeDatabase();
        const { id } = params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'You must be logged in to delete groups.' }, { status: 401 });
        }

        const [existing] = await pool.query('SELECT id, creatorId FROM `groups` WHERE id = ?', [id]);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        if (existing[0].creatorId !== currentUser.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await pool.query('DELETE FROM `groups` WHERE id = ?', [id]);

        return NextResponse.json({ message: 'Group deleted successfully' });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete group', message: error.message },
            { status: 500 }
        );
    }
}
