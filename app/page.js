import { initializeDatabase } from '@/lib/initDb';
import EventsPage from './components/EventsPage';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Leaf } from 'lucide-react';
import { fetchEventsFeed } from '@/lib/feedQueries';
import pool from '@/lib/db';

// Mark page as dynamic to avoid build-time database access
export const dynamic = 'force-dynamic';

async function getGroups() {
  try {
    const [groups] = await pool.query(`
      SELECT id, name
      FROM \`groups\`
      ORDER BY name ASC
    `);
    return groups;
  } catch (err) {
    console.error('Error fetching groups:', err);
    return [];
  }
}

export default async function Home() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  await initializeDatabase();
  const [events, groups] = await Promise.all([
    fetchEventsFeed(currentUser.id),
    getGroups(),
  ]);

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
              <Link
                className="rounded-full px-3 py-2 bg-emerald-100 text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                href="/"
              >
                Feed
              </Link>
              <Link
                className="rounded-full px-3 py-2 transition hover:bg-emerald-50"
                href="/groups"
              >
                Groups
              </Link>
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

      <main className="mx-auto max-w-3xl px-6 pb-24">
        {events.length === 0 && (
          <section className="mb-8 rounded-3xl bg-white/80 p-8 text-center shadow-sm ring-1 ring-emerald-100 backdrop-blur">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-2xl">
              🌱
            </div>
            <h2 className="text-2xl font-semibold text-emerald-950">
              Hi {currentUser.name?.split(' ')[0] || 'friend'}, ready to gather?
            </h2>
            <p className="mt-2 text-sm text-emerald-700">
              Your feed is quiet—create an event to bring the community
              together.
            </p>
          </section>
        )}

        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <EventsPage
            initialEvents={events}
            currentUser={currentUser}
            groups={groups}
          />
        </section>
      </main>
    </div>
  );
}
