import { NextResponse } from 'next/server';
import { findShipment } from '@/lib/shipments';
import { isSwiftstreamNumber } from '@/lib/carriers';
import { normalizeTrackingNumber, resolveShipment } from '@/lib/tracking';
import type { Shipment, ShipmentStatus, TrackingStage } from '@/lib/tracking';
import { readWorkspace, workspaceDb } from '@/lib/eazytools-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const workspaceStatuses: Record<string, ShipmentStatus> = {
  Booked: 'Shipment Created',
  'Picked up': 'Picked Up',
  'In transit': 'In Transit',
  'At facility': 'Arrived at Facility',
  'Out for delivery': 'Out for Delivery',
  Delivered: 'Delivered',
  Exception: 'On Hold',
};

function workspaceShipment(data: FirebaseFirestore.DocumentData): Shipment | null {
  if (typeof data.trackingNumber !== 'string' || typeof data.origin !== 'string' || typeof data.destination !== 'string') return null;
  const status = workspaceStatuses[String(data.status)] || 'Shipment Created';
  const eventStage = status as TrackingStage;
  return {
    trackingNumber: normalizeTrackingNumber(data.trackingNumber),
    status,
    service: typeof data.service === 'string' ? data.service : '',
    origin: data.origin,
    destination: data.destination,
    currentLocation: typeof data.currentLocation === 'string' ? data.currentLocation : data.origin,
    etaInDays: 0,
    pieces: typeof data.pieces === 'number' ? data.pieces : 1,
    weight: typeof data.weight === 'string' ? data.weight : '',
    dimensions: typeof data.dimensions === 'string' ? data.dimensions : '',
    carrier: typeof data.carrier === 'string' ? data.carrier : 'SwiftStream Cargo',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : null,
    events: [{
      stage: eventStage,
      title: status,
      location: typeof data.currentLocation === 'string' ? data.currentLocation : data.origin,
      hoursAgo: 0,
      at: typeof data.updatedAt === 'string' ? data.updatedAt : typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
      description: status === 'Shipment Created' ? 'Your shipment has been booked and its tracking number is active.' : `Shipment status updated to ${status}.`,
    }],
  };
}

async function indexedWorkspaceShipment(trackingNumber: string): Promise<Shipment | null> {
  const db = workspaceDb();
  const indexRef = db.collection('workspaceTracking').doc(trackingNumber);
  const pointer = await indexRef.get();
  if (pointer.exists) {
    const siteId = pointer.get('siteId');
    const shipmentId = pointer.get('shipmentId');
    if (typeof siteId === 'string' && typeof shipmentId === 'string') {
      const stored = await db.collection('premiumTemplateSites').doc(siteId).collection('shipments').doc(shipmentId).get();
      if (stored.exists && stored.get('trackingNumber') === trackingNumber) return workspaceShipment(stored.data() || {});
    }
  }

  // Compatibility for shipments created before the public index was added.
  // Once found, cache a pointer so every later lookup is a cheap point read.
  const legacy = await db.collectionGroup('shipments').where('trackingNumber', '==', trackingNumber).limit(1).get();
  const match = legacy.docs[0];
  const siteRef = match?.ref.parent.parent;
  if (!match || siteRef?.parent?.id !== 'premiumTemplateSites') return null;
  await indexRef.set({ siteId: siteRef.id, shipmentId: match.id, createdAt: new Date().toISOString(), migrated: true });
  return workspaceShipment(match.data());
}

/** Public exact-number lookup. Every returned event comes from the stored shipment document. */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('number')?.trim() ?? '';
  const siteId = new URL(request.url).searchParams.get('site')?.trim() ?? '';
  if (!raw) return NextResponse.json({ error: 'Enter a tracking number.' }, { status: 400 });
  if (raw.length > 64) return NextResponse.json({ error: 'That is too long to be a tracking number.' }, { status: 400 });
  if (!isSwiftstreamNumber(raw)) {
    return NextResponse.json({ error: 'Enter a valid Swiftstream Cargo tracking number.' }, { status: 400 });
  }
  try {
    if (siteId) {
      if (!/^[a-f0-9]{24}$/.test(siteId) || !(await readWorkspace(siteId))) {
        return NextResponse.json({ error: 'Website not found.' }, { status: 404 });
      }
      const matches = await workspaceDb()
        .collection('premiumTemplateSites').doc(siteId)
        .collection('shipments').where('trackingNumber', '==', normalizeTrackingNumber(raw)).limit(1).get();
      const stored = matches.docs[0] ? workspaceShipment(matches.docs[0].data()) : null;
      if (!stored) return NextResponse.json({ error: 'No stored shipment matches that number.' }, { status: 404 });
      return NextResponse.json({ kind: 'workspace', shipment: resolveShipment(stored) });
    }
    const shipment = await findShipment(normalizeTrackingNumber(raw));
    if (shipment) return NextResponse.json({ kind: 'internal', shipment: resolveShipment(shipment) });
    const workspace = await indexedWorkspaceShipment(normalizeTrackingNumber(raw));
    if (!workspace) return NextResponse.json({ error: 'No stored shipment matches that number.' }, { status: 404 });
    return NextResponse.json({ kind: 'workspace', shipment: resolveShipment(workspace) });
  } catch (error) {
    console.error('[tracking] lookup failed', error);
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 });
  }
}
