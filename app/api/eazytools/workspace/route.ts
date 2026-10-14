import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { currentOwner, readWorkspace, workspaceDb, workspaceId } from '@/lib/eazytools-workspace';

export const runtime = 'nodejs';
const statuses = new Set(['Booked', 'Picked up', 'In transit', 'At facility', 'Out for delivery', 'Delivered', 'Exception']);
const clean = (value: unknown, max = 120) => typeof value === 'string' ? value.trim().slice(0, max) : '';

async function context() {
  const ownerId = await currentOwner();
  if (!ownerId) return null;
  const siteId = workspaceId(ownerId);
  const site = await readWorkspace(siteId);
  return site?.ownerId === ownerId ? { ownerId, siteId, site } : null;
}

export async function GET() {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: 'Open your admin from EazyTool again.' }, { status: 401 });
  const root = workspaceDb().collection('premiumTemplateSites').doc(ctx.siteId);
  const [shipments, audit, enquiries, chats, emailTemplate] = await Promise.all([
    root.collection('shipments').orderBy('createdAt', 'desc').limit(50).get(),
    root.collection('audit_logs').orderBy('createdAt', 'desc').limit(12).get(),
    root.collection('enquiries').orderBy('createdAt', 'desc').limit(50).get(),
    root.collection('chats').orderBy('updatedAt', 'desc').limit(50).get(),
    root.collection('email_templates').doc('shipment-update').get(),
  ]);
  return NextResponse.json({
    site: ctx.site,
    shipments: shipments.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    audit: audit.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    enquiries: enquiries.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    chats: chats.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    emailTemplate: emailTemplate.exists ? emailTemplate.data() : { subject: 'Update for shipment {{trackingNumber}}', body: 'Hello {{customerName}},\n\nYour shipment status is now {{status}}.\n\nThank you.' },
  });
}

export async function POST(request: Request) {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: 'Your admin session has expired.' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const action = clean(body.action, 40);
  const root = workspaceDb().collection('premiumTemplateSites').doc(ctx.siteId);
  const now = new Date().toISOString();
  if (action === 'shipment-create') {
    const customer = clean(body.customer); const customerEmail = clean(body.customerEmail, 180).toLowerCase(); const originName = clean(body.origin); const destination = clean(body.destination); const service = clean(body.service, 80) || 'Road transport';
    if (!customer || !originName || !destination) return NextResponse.json({ error: 'Customer, origin, and destination are required.' }, { status: 400 });
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return NextResponse.json({ error: 'Enter a valid customer email.' }, { status: 400 });
    const id = randomUUID();
    const trackingNumber = `SSC-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    await workspaceDb().runTransaction(async transaction => {
      transaction.create(root.collection('shipments').doc(id), { id, trackingNumber, customer, customerEmail, origin: originName, destination, service, status: 'Booked', createdAt: now, updatedAt: now });
      transaction.create(root.collection('audit_logs').doc(), { actorId: ctx.ownerId, action: 'shipment.created', targetId: id, createdAt: now });
    });
    return NextResponse.json({ ok: true });
  }
  if (action === 'template-save') {
    const subject = clean(body.subject, 180); const templateBody = clean(body.body, 4000);
    if (!subject || !templateBody) return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
    await workspaceDb().runTransaction(async transaction => {
      transaction.set(root.collection('email_templates').doc('shipment-update'), { subject, body: templateBody, updatedAt: now, updatedBy: ctx.ownerId }, { merge: true });
      transaction.create(root.collection('audit_logs').doc(), { actorId: ctx.ownerId, action: 'email_template.updated', targetId: 'shipment-update', createdAt: now });
    });
    return NextResponse.json({ ok: true, message: 'Email template saved.' });
  }
  if (action === 'shipment-status') {
    const id = clean(body.id, 80); const status = clean(body.status, 40);
    if (!id || !statuses.has(status)) return NextResponse.json({ error: 'Choose a valid shipment status.' }, { status: 400 });
    await workspaceDb().runTransaction(async transaction => {
      const ref = root.collection('shipments').doc(id); const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error('Shipment not found.');
      transaction.update(ref, { status, updatedAt: now });
      transaction.create(root.collection('audit_logs').doc(), { actorId: ctx.ownerId, action: 'shipment.status.updated', targetId: id, status, createdAt: now });
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
