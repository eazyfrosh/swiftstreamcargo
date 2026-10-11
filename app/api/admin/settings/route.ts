import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { saveWebsiteConfig, writeAudit } from '@/lib/operations';

export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const result = await saveWebsiteConfig(body);
  if ('error' in result && typeof result.error === 'string') return NextResponse.json({ error: result.error }, { status: result.error.includes('configured') ? 503 : 400 });
  await writeAudit(session.email, 'website.settings_updated', 'settings/website');
  return NextResponse.json({ ok: true, config: result.value });
}
