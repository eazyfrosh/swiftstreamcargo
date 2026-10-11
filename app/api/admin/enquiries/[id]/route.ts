import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateEnquiry, writeAudit, type EnquiryStatus } from '@/lib/operations';

export const runtime = 'nodejs';
type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { status?: EnquiryStatus };
  if (!['new', 'in_progress', 'resolved', 'archived'].includes(body.status ?? '')) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  if (!(await updateEnquiry(id, body.status!))) return NextResponse.json({ error: 'Firestore is not configured.' }, { status: 503 });
  await writeAudit(session.email, 'enquiry.status_changed', id, body.status);
  return NextResponse.json({ ok: true });
}
