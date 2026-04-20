import { NextRequest, NextResponse } from 'next/server';
import { calculateExposure, snapshotExposure } from '@/lib/credit-control';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const exposure = await calculateExposure(params.id);
  return NextResponse.json({ exposure });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const snapshot = await snapshotExposure(params.id);
  return NextResponse.json({ snapshot }, { status: 201 });
}
