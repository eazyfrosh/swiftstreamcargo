import { NextResponse } from 'next/server';
import { createOwnerSession, defaultSettings, OWNER_COOKIE, workspaceDb, workspaceId } from '@/lib/eazytools-workspace';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const destination = ['admin', 'editor', 'preview'].includes(url.searchParams.get('destination') ?? '') ? url.searchParams.get('destination')! : 'editor';
  if (!token || token.length > 4096) return NextResponse.redirect(new URL('/?templateError=missing-access', request.url));
  const marketplace = (process.env.EAZYTOOLS_MARKETPLACE_ORIGIN || 'https://www.eazytool.app').replace(/\/$/, '');
  try {
    const validation = await fetch(`${marketplace}/api/licenses/validate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, serviceSlug: 'premium-templates' }), cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    const result = await validation.json();
    if (!validation.ok || !result.valid || !result.userId) return NextResponse.redirect(new URL('/?templateError=access-denied', request.url));
    const ownerId = String(result.userId);
    const siteId = workspaceId(ownerId);
    const ref = workspaceDb().collection('premiumTemplateSites').doc(siteId);
    await workspaceDb().runTransaction(async transaction => {
      const existing = await transaction.get(ref);
      const now = new Date().toISOString();
      if (!existing.exists) transaction.create(ref, { ...defaultSettings(siteId, ownerId), templateId: 'swiftstream-cargo', status: 'active', createdAt: now });
      else transaction.set(ref, { ownerId, templateId: 'swiftstream-cargo', status: 'active', updatedAt: now }, { merge: true });
      transaction.set(ref.collection('workspace_members').doc(ownerId), { userId: ownerId, role: 'owner', status: 'active', updatedAt: now }, { merge: true });
    });
    const target = destination === 'preview' ? `/site/${siteId}` : destination === 'admin' ? '/owner-admin' : '/template-editor';
    const response = NextResponse.redirect(new URL(target, request.url));
    response.cookies.set(OWNER_COOKIE, createOwnerSession(ownerId), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 8 * 60 * 60 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('[eazytools-sso]', error instanceof Error ? error.message : error);
    return NextResponse.redirect(new URL('/?templateError=service-unavailable', request.url));
  }
}
