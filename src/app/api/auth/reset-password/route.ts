import { NextRequest, NextResponse } from 'next/server';
import { createHash, scryptSync, randomBytes } from 'crypto';
import { and, eq, isNull, gt } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { ensureAuthTables } from '@/lib/auth-bootstrap';

export const runtime = 'nodejs';

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json().catch(() => ({}));
    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    await ensureAuthTables();
    const db = getDb();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const rows = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(
        and(
          eq(schema.passwordResetTokens.tokenHash, tokenHash),
          isNull(schema.passwordResetTokens.usedAt),
          gt(schema.passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    const record = rows[0];
    if (!record) {
      return NextResponse.json({ error: 'Reset link is invalid or has expired' }, { status: 400 });
    }
    const passwordHash = hashPassword(password);
    await db
      .update(schema.authUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(schema.authUsers.id, record.userId));
    await db
      .update(schema.passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.passwordResetTokens.id, record.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[reset-password] error', e);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
