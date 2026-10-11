import { NextResponse } from 'next/server';
import { findShipment } from '@/lib/shipments';
import { isSwiftstreamNumber } from '@/lib/carriers';
import { normalizeTrackingNumber, resolveShipment } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public exact-number lookup. Every returned event comes from the stored shipment document. */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('number')?.trim() ?? '';
  if (!raw) return NextResponse.json({ error: 'Enter a tracking number.' }, { status: 400 });
  if (raw.length > 64) return NextResponse.json({ error: 'That is too long to be a tracking number.' }, { status: 400 });
  if (!isSwiftstreamNumber(raw)) {
    return NextResponse.json({ error: 'Enter a valid Swiftstream Cargo tracking number.' }, { status: 400 });
  }
  try {
    const shipment = await findShipment(normalizeTrackingNumber(raw));
    if (!shipment) return NextResponse.json({ error: 'No stored shipment matches that number.' }, { status: 404 });
    return NextResponse.json({ kind: 'internal', shipment: resolveShipment(shipment) });
  } catch (error) {
    console.error('[tracking] lookup failed', error);
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 });
  }
}
