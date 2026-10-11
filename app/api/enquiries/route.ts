import { NextResponse } from 'next/server';
import { createEnquiry, rateLimitPublicForm, validatePublicEnquiry, type EnquiryKind } from '@/lib/operations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Malformed request.' }, { status: 400 }); }
  const kind = (body as { kind?: unknown })?.kind;
  if (kind !== 'quote' && kind !== 'contact') return NextResponse.json({ error: 'Unknown enquiry type.' }, { status: 400 });
  const parsed = validatePublicEnquiry(kind as EnquiryKind, body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  if (!(await rateLimitPublicForm(ip, kind))) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  const created = await createEnquiry(kind, parsed.value);
  if (!created) return NextResponse.json({ error: 'Enquiries are temporarily unavailable. Please use the phone or email shown on this page.' }, { status: 503 });
  return NextResponse.json({ ok: true, reference: created.id.slice(0, 8).toUpperCase() }, { status: 201 });
}
