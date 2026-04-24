import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { ensureAuthTables } from '@/lib/auth-bootstrap';
import { sendPasswordResetEmail } from '@/lib/mailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: true });
    }
    await ensureAuthTables();
    const db = getDb();
    const normalized = email.trim().toLowerCase();
    const rows = await db.select().from(schema.authUsers).where(eq(schema.authUsers.email, normalized)).limit(1);
    const user = rows[0];
    if (user) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(schema.passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });
      const base = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || `${req.nextUrl.origin}`;
      const resetUrl = `${base.replace(/\/$/, '')}/reset-password?token=${token}`;
      try {
        await sendPasswordResetEmail(normalized, resetUrl);
      } catch (e) {
        console.error('[forgot-password] email send failed', e);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[forgot-password] error', e);
    return NextResponse.json({ ok: true });
  }
}
