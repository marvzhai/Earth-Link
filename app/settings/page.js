import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import SettingsClient from '../components/SettingsClient';

export const dynamic = 'force-dynamic';

const navLinks = [
  { href: '/events', label: 'Events' },
  { href: '/map', label: 'Map' },
  { href: '/groups', label: 'Groups' },
];

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

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

      <main className="mx-auto max-w-2xl px-6 pb-24">
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to profile
          </Link>
        </div>

        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <SettingsClient user={currentUser} />
        </section>
      </main>
    </div>
  );
}
