import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { documentIngestions } from '@/db/schema';

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const [row] = await db
    .insert(documentIngestions)
    .values({
      kind: body.kind,
      status: 'extracted',
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
  return NextResponse.json({ ingestion: row }, { status: 201 });
}
