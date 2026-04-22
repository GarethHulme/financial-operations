import { NextResponse } from 'next/server';
import { getClient } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getClient();
    await sql`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: err?.message ?? String(err) },
      { status: 503 },
    );
  }
}
