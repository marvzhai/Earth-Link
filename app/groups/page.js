import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import GroupsPage from '@/app/components/GroupsPage';

// Mark page as dynamic to allow DB access
export const dynamic = 'force-dynamic';

async function getGroups() {
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
        return groups;
    } catch (err) {
        console.error('Error fetching groups:', err);
        return [];
    }
}

export default async function Page() {
    const groups = await getGroups();

    return (
        <main className="container mx-auto px-6 py-12 max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
                <a href="/" className="inline-flex items-center gap-2 text-stone-700 hover:opacity-80 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L6.414 9H17a1 1 0 110 2H6.414l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Back to Feed</span>
                </a>

                <div />
            </div>

            <GroupsPage initialGroups={groups} />
        </main>
    );
}
