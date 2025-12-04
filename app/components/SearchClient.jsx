'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'groups', label: 'Groups' },
  { key: 'users', label: 'People' },
];

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default function SearchClient({ initialQuery = '' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ events: [], groups: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ events: [], groups: [], users: [] });
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      if (response.ok) {
        setResults(data);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
      // Update URL
      if (query) {
        router.replace(`/search?q=${encodeURIComponent(query)}`, {
          scroll: false,
        });
      } else {
        router.replace('/search', { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search, router]);

  // Initial search if query provided
  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
    }
  }, [initialQuery, search]);

  const totalResults =
    results.events.length + results.groups.length + results.users.length;

  const filteredResults = {
    events: activeTab === 'all' || activeTab === 'events' ? results.events : [],
    groups: activeTab === 'all' || activeTab === 'groups' ? results.groups : [],
    users: activeTab === 'all' || activeTab === 'users' ? results.users : [],
  };

  return (
    <div>
      {/* Search Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-emerald-900">Search</h2>
        <p className="text-sm text-emerald-600">
          Find events, groups, and people in the community
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <svg
              className="h-5 w-5 animate-spin text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for events, groups, or people..."
          className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 py-3 pl-12 pr-4 text-emerald-900 placeholder:text-emerald-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      {hasSearched && (
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            let count = 0;
            if (tab.key === 'all') count = totalResults;
            else if (tab.key === 'events') count = results.events.length;
            else if (tab.key === 'groups') count = results.groups.length;
            else if (tab.key === 'users') count = results.users.length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {hasSearched ? (
        totalResults === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-4xl">🔍</div>
            <h3 className="text-lg font-semibold text-emerald-900">
              No results found
            </h3>
            <p className="mt-1 text-sm text-emerald-600">
              Try a different search term or create something new!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Events */}
            {filteredResults.events.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Events
                </h3>
                <div className="space-y-3">
                  {filteredResults.events.map((event) => (
                    <Link
                      key={event.id}
                      href="/events"
                      className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white/80 p-4 transition hover:border-emerald-200 hover:bg-white"
                    >
                      <div className="flex flex-col items-center rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                        <span className="text-xs uppercase">
                          {new Date(event.eventTime).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-xl font-semibold text-emerald-900">
                          {new Date(event.eventTime).getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-emerald-900">
                          {event.title}
                        </h4>
                        <p className="mt-1 text-sm text-emerald-600">
                          {event.location || 'Location TBA'}
                          {event.groupName && ` · ${event.groupName}`}
                        </p>
                        {event.rsvpCount > 0 && (
                          <p className="mt-1 text-xs text-emerald-500">
                            {event.rsvpCount} going
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {filteredResults.groups.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Groups
                </h3>
                <div className="space-y-3">
                  {filteredResults.groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups?view=${group.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white/80 p-4 transition hover:border-emerald-200 hover:bg-white"
                    >
                      {group.iconData ? (
                        <img
                          src={group.iconData}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 text-lg font-semibold text-white">
                          {group.name?.[0]?.toUpperCase() || 'G'}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-emerald-900">
                          {group.name}
                        </h4>
                        <p className="mt-0.5 text-sm text-emerald-600">
                          {group.memberCount} members
                          {group.location && ` · ${group.location}`}
                        </p>
                      </div>
                      {group.isMember && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Joined
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {filteredResults.users.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  People
                </h3>
                <div className="space-y-3">
                  {filteredResults.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white/80 p-4 transition hover:border-emerald-200 hover:bg-white"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 text-lg font-semibold text-white">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-emerald-900">
                          {user.name}
                        </h4>
                        <p className="text-sm text-emerald-600">@{user.handle}</p>
                        {user.bio && (
                          <p className="mt-1 text-sm text-emerald-700 line-clamp-1">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="py-12 text-center">
          <div className="mb-4 text-4xl">🌿</div>
          <h3 className="text-lg font-semibold text-emerald-900">
            Start searching
          </h3>
          <p className="mt-1 text-sm text-emerald-600">
            Type at least 2 characters to search events, groups, and people
          </p>
        </div>
      )}
    </div>
  );
}

