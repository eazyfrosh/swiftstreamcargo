import { NextResponse } from 'next/server';
import { readWorkspace } from '@/lib/eazytools-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public brand asset used by the customer website and transactional emails. */
export async function GET(request: Request) {
  const siteId = new URL(request.url).searchParams.get('site')?.trim() ?? '';
  if (!/^[a-f0-9]{24}$/.test(siteId)) return new NextResponse(null, { status: 404 });

  const site = await readWorkspace(siteId).catch(() => null);
  const match = site?.logoDataUrl?.match(/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(match[2], 'base64'), {
    headers: {
      'Content-Type': `image/${match[1]}`,
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
