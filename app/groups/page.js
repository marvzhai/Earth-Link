import pool from '@/lib/db';
import { initializeDatabase } from '@/lib/initDb';
import GroupsPage from '@/app/components/GroupsPage';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Leaf } from 'lucide-react';

// Mark page as dynamic to allow DB access
export const dynamic = 'force-dynamic';

function parseStoredImages(imageData) {
  if (!imageData) return [];
  if (Array.isArray(imageData)) {
    return imageData.filter(
      (v) => typeof v === 'string' && v.startsWith('data:image/')
    );
  }
  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (v) => typeof v === 'string' && v.startsWith('data:image/')
        );
      }
    } catch {
      if (imageData.startsWith('data:image/')) return [imageData];
    }
  }
  return [];
}

async function getGroups(userId) {
  try {
    await initializeDatabase();
    const [groups] = await pool.query(
      `
      SELECT
        \`groups\`.id,
        \`groups\`.name,
        \`groups\`.location,
        \`groups\`.description,
        \`groups\`.websiteUrl,
        \`groups\`.iconData,
        \`groups\`.imageData,
        \`groups\`.createdAt,
        \`groups\`.creatorId,
        users.handle as creatorHandle,
        users.name as creatorName,
        (SELECT COUNT(*) FROM group_members WHERE group_members.groupId = \`groups\`.id) AS memberCount,
        (SELECT COUNT(*) FROM group_members WHERE group_members.groupId = \`groups\`.id AND group_members.userId = ?) > 0 AS isMember
      FROM \`groups\`
      JOIN users ON \`groups\`.creatorId = users.id
      ORDER BY \`groups\`.createdAt DESC
    `,
      [userId ?? -1]
    );

    // Parse imageData for each group
    return groups.map((group) => ({
      ...group,
      images: parseStoredImages(group.imageData),
      memberCount: Number(group.memberCount) || 0,
      isMember: Boolean(Number(group.isMember)),
    }));
  } catch (err) {
    console.error('Error fetching groups:', err);
    return [];
  }
}

export default async function Page() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const groups = await getGroups(currentUser.id);

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
                className="rounded-full px-3 py-2 transition hover:bg-emerald-50"
                href="/"
              >
                Feed
              </Link>
              <Link
                className="rounded-full px-3 py-2 transition hover:bg-emerald-50"
                href="/events"
              >
                Events
              </Link>
              <Link
                className="rounded-full px-3 py-2 bg-emerald-100 text-emerald-900 shadow-sm transition hover:bg-emerald-50"
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
        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
          <GroupsPage initialGroups={groups} currentUser={currentUser} />
        </section>
      </main>
    </div>
  );
}
