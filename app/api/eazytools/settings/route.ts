import { NextResponse } from 'next/server';
import { cleanSettings, currentOwner, readWorkspace, workspaceDb, workspaceId } from '@/lib/eazytools-workspace';

export const runtime = 'nodejs';

export async function GET() {
  const ownerId = await currentOwner();
  if (!ownerId) return NextResponse.json({ error: 'Open this editor from EazyTool again.' }, { status: 401 });
  const settings = await readWorkspace(workspaceId(ownerId));
  return settings ? NextResponse.json({ settings }) : NextResponse.json({ error: 'Your website workspace was not found.' }, { status: 404 });
}

export async function POST(request: Request) {
  const ownerId = await currentOwner();
  if (!ownerId) return NextResponse.json({ error: 'Your editor session has expired.' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const siteId = workspaceId(ownerId);
    const settings = cleanSettings(await request.json(), siteId, ownerId);
    const ref = workspaceDb().collection('premiumTemplateSites').doc(siteId);
    await workspaceDb().runTransaction(async transaction => {
      const current = await transaction.get(ref);
      if (!current.exists || current.get('ownerId') !== ownerId) throw new Error('Workspace not found.');
      transaction.set(ref, settings, { merge: true });
      transaction.create(ref.collection('audit_logs').doc(), { actorId: ownerId, action: 'website.settings.updated', createdAt: settings.updatedAt });
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Settings could not be saved.' }, { status: 400 });
  }
}
