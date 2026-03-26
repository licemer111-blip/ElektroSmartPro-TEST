import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Never cache this route
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { version: process.env.NEXT_PUBLIC_APP_VERSION },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
