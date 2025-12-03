import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST(request) {
  try {
    await destroySession();
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Unable to log out. Please try again.' },
      { status: 500 }
    );
  }
}
