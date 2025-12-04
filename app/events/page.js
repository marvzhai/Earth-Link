import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import EventsPage from '@/app/components/EventsPage';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { fetchAllEventsWithMeta } from '@/lib/eventQueries';

// Mark page as dynamic to allow DB access
export const dynamic = 'force-dynamic';

async function getGroups() {
  try {
    await initializeDatabase();
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

const navLinks = [
  { href: '/', label: 'Feed' },
  { href: '/groups', label: 'Groups' },
];

export default async function Page() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  await initializeDatabase();
  const [events, groups] = await Promise.all([
    fetchAllEventsWithMeta(currentUser.id),
    getGroups(),
  ]);

  // Sort by eventTime for upcoming events display
  const sortedByTime = [...events].sort(
    (a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
  );
  const nextEvent = sortedByTime.find(
    (e) => new Date(e.eventTime).getTime() >= Date.now()
  );

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
                  className="rounded-full px-3 py-2 transition hover:bg-emerald-50"
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

      <main className="mx-auto max-w-4xl px-6 pb-24 space-y-8">
        <section className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-emerald-500">
                Community Calendar
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-emerald-900">
                Discover gatherings rooted in nature and connection
              </h2>
              <p className="mt-2 text-sm text-emerald-600">
                {events.length > 0
                  ? `We have ${events.length} ${
                      events.length === 1 ? 'event' : 'events'
                    } on the horizon.`
                  : 'No events yet—start the first one and invite the community.'}
              </p>
            </div>
            {nextEvent && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-4 text-sm text-emerald-800 ring-1 ring-emerald-100">
                <p className="text-xs uppercase tracking-wide text-emerald-500">
                  Next up
                </p>
                <p className="mt-1 font-semibold text-emerald-900">
                  {nextEvent.title}
                </p>
                <p className="text-emerald-700">
                  {new Date(nextEvent.eventTime).toLocaleString()} ·{' '}
                  {nextEvent.location || 'TBA'}
                </p>
              </div>
            )}
          </div>
        </section>

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
