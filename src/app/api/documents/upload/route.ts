import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getDb } from '@/db';
import { documentIngestions } from '@/db/schema';

const UPLOAD_DIR = '/tmp/uploads';

const ALLOWED_KINDS = [
  'supplier_invoice',
  'client_invoice',
  'supplier_contract',
  'client_contract',
  'credit_note',
  'receipt',
  'supporting',
] as const;

type Kind = (typeof ALLOWED_KINDS)[number];

export async function POST(req: NextRequest) {
  const db = getDb();
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    const kindRaw = String(form.get('kind') || '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_KINDS.includes(kindRaw as Kind)) {
      return NextResponse.json({ error: 'Invalid or missing kind' }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(file.name) || '';
    const storedName = `${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(UPLOAD_DIR, storedName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, bytes);

    const [row] = await db
      .insert(documentIngestions)
      .values({
        kind: kindRaw as Kind,
        status: 'uploaded',
        originalFileName: file.name,
        fileUrl: `/tmp/uploads/${storedName}`,
        mimeType: file.type || null,
        sizeBytes: bytes.byteLength,
      })
      .returning();
    return NextResponse.json({ ingestion: row, id: row.id }, { status: 201 });
  }

  const body = await req.json();
  const [row] = await db
    .insert(documentIngestions)
    .values({
      kind: body.kind,
      status: body.status ?? 'uploaded',
      originalFileName: body.originalFileName,
      fileUrl: body.fileUrl ?? null,
      mimeType: body.mimeType ?? null,
      sizeBytes: body.sizeBytes ?? null,
      ocrConfidence: body.ocrConfidence != null ? String(body.ocrConfidence) : null,
      extractedFields: body.extractedFields ?? null,
      fieldConfidence: body.fieldConfidence ?? null,
      suggestedMatches: body.suggestedMatches ?? null,
      duplicateRiskFlags: body.duplicateRiskFlags ?? null,
      contractMismatchFlags: body.contractMismatchFlags ?? null,
      creditWarningFlags: body.creditWarningFlags ?? null,
    })
    .returning();
  return NextResponse.json({ ingestion: row, id: row.id }, { status: 201 });
}
