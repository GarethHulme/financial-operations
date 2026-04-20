import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { forecastSnapshots } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { rebuildForecast } from '@/lib/forecasting';
import { weekKey, startOfWeek } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(forecastSnapshots).orderBy(desc(forecastSnapshots.createdAt)).limit(50);
  return NextResponse.json({ snapshots: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const start = body.start ? new Date(body.start) : startOfWeek();
  const end = body.end ? new Date(body.end) : new Date(start.getTime() + 6 * 86400000);
  const key = body.periodKey ?? weekKey(start);
  const snap = await rebuildForecast({
    key,
    start,
    end,
    scenario: body.scenario ?? 'baseline',
  });
  return NextResponse.json({ snapshot: snap });
}
