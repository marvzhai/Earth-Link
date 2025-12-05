import { initializeDatabase } from '@/lib/initDb';
import { getCurrentUser } from '@/lib/auth';
import { fetchAllEventsWithMeta } from '@/lib/eventQueries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Leaf } from 'lucide-react';
import EventMap from '../components/EventMap';

// Mark page as dynamic to allow DB access
export const dynamic = 'force-dynamic';

const navLinks = [
  { href: '/events', label: 'Events' },
  { href: '/map', label: 'Map' },
  { href: '/groups', label: 'Groups' },
];

export default async function MapPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  await initializeDatabase();
  const events = await fetchAllEventsWithMeta(currentUser.id);

  // Filter events that have coordinates
  const eventsWithLocation = events.filter(
    (event) => event.latitude && event.longitude
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-green-100 text-emerald-950">
      <header className="px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-center gap-4">
            <Link
              href="/events"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white text-2xl"
            >
              <Leaf className="h-7 w-7" />
            </Link>
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
                    link.href === '/map'
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
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
            Profile
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* Hero Section */}
        <section className="mb-6 rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-emerald-500">
                Explore Locally
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-emerald-900">
                Events near you
              </h2>
              <p className="mt-2 text-sm text-emerald-600">
                {eventsWithLocation.length > 0
                  ? `${eventsWithLocation.length} ${
                      eventsWithLocation.length === 1 ? 'event' : 'events'
                    } on the map`
                  : 'No events with locations yet. Create one with a map pin!'}
              </p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create event
            </Link>
          </div>
        </section>

        {/* Map Section */}
        <section className="rounded-3xl bg-white/90 shadow-sm ring-1 ring-emerald-100 backdrop-blur overflow-hidden">
          <EventMap events={eventsWithLocation} />
        </section>

        {/* Legend */}
        <section className="mt-6 rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <h3 className="mb-4 text-lg font-semibold text-emerald-900">
            Map Legend
          </h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-emerald-500"></div>
              <span className="text-emerald-700">Upcoming events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-stone-400"></div>
              <span className="text-emerald-700">Past events</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-emerald-500">
            Click on a marker to see event details. Events without a location
            won&apos;t appear on the map.
          </p>
        </section>
      </main>
    </div>
  );
}
