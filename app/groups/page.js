import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import GroupsPage from '@/app/components/GroupsPage';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Leaf } from 'lucide-react';

// Mark page as dynamic to allow DB access
export const dynamic = 'force-dynamic';

async function getGroups() {
  try {
    await initializeDatabase();
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
      ORDER BY \`groups\`.createdAt DESC
    `);
    return groups;
  } catch (err) {
    console.error('Error fetching groups:', err);
    return [];
  }
}

const navLinks = [
  { href: '/', label: 'Feed' },
  { href: '/groups', label: 'Groups' },
];

export default async function Page() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const groups = await getGroups();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-green-100 text-emerald-950">
      <header className="px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white text-2xl">
              <Leaf className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-emerald-900">
                Earth Link
              </h1>
            </div>
            <div className="ml-6 flex items-center gap-2 text-sm text-emerald-700">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  className={`rounded-full px-3 py-2 transition hover:bg-emerald-50 ${
                    link.href === '/groups'
                      ? 'bg-emerald-100 text-emerald-900 shadow-sm'
                      : ''
                  }`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2 text-sm font-medium text-white shadow ring-1 ring-emerald-400/50 transition hover:shadow-md"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
              {currentUser.name?.[0]?.toUpperCase() || 'U'}
            </span>
            Profile
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24">
        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <GroupsPage initialGroups={groups} currentUser={currentUser} />
        </section>
      </main>
    </div>
  );
}
