import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { currentOwner, readWorkspace, workspaceDb, workspaceId } from '@/lib/eazytools-workspace';
import { deliverEmail, emailConfigError, emailConfigured } from '@/lib/email';
import { DEFAULT_TEMPLATES, fillPlaceholders, renderHtml } from '@/lib/email/templates';

export const runtime = 'nodejs';
const statuses = new Set(['Booked', 'Picked up', 'In transit', 'At facility', 'Out for delivery', 'Delivered', 'Exception']);
const templateIds = new Set(DEFAULT_TEMPLATES.map(template => template.id));
const clean = (value: unknown, max = 120) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const email = (value: unknown) => { const result = clean(value, 180).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result) ? result : ''; };

function variables(site: Awaited<ReturnType<typeof readWorkspace>>, shipment: FirebaseFirestore.DocumentData, recipientName: string, origin: string) {
  return {
    recipientName: recipientName || shipment.customer || 'there', trackingNumber: shipment.trackingNumber || '', status: shipment.status || '',
    service: shipment.service || shipment.shipmentType || '', origin: shipment.origin || '', destination: shipment.destination || '',
    currentLocation: shipment.currentLocation || shipment.origin || '', carrier: shipment.carrier || site?.name || 'Our logistics team',
    pieces: String(shipment.pieces || 1), weight: shipment.weight || '', estimatedDelivery: shipment.estimatedDelivery || shipment.pickupDate || 'To be confirmed',
    trackingUrl: `${origin}/site/${site?.siteId || ''}#tracking`, companyName: site?.name || 'SwiftStream Cargo',
  };
}

function mergeTemplates(docs: FirebaseFirestore.QueryDocumentSnapshot[]) {
  const stored = new Map(docs.map(doc => [doc.id, doc.data()]));
  return DEFAULT_TEMPLATES.map(template => ({ ...template, ...stored.get(template.id), id: template.id }));
}

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
  const [shipments, audit, enquiries, chats, emailTemplates, emailSends] = await Promise.all([
    root.collection('shipments').orderBy('createdAt', 'desc').limit(50).get(),
    root.collection('audit_logs').orderBy('createdAt', 'desc').limit(12).get(),
    root.collection('enquiries').orderBy('createdAt', 'desc').limit(50).get(),
    root.collection('chats').orderBy('updatedAt', 'desc').limit(50).get(),
    root.collection('email_templates').get(),
    root.collection('email_sends').orderBy('createdAt', 'desc').limit(100).get(),
  ]);
  return NextResponse.json({
    site: ctx.site,
    shipments: shipments.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    audit: audit.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    enquiries: enquiries.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    chats: chats.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    emailTemplates: mergeTemplates(emailTemplates.docs),
    emailSends: emailSends.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    emailConfigured: emailConfigured(),
    emailConfigError: emailConfigError(),
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
    const customer = clean(body.customer); const customerEmail = email(body.customerEmail); const fromCountry = clean(body.fromCountry); const fromCity = clean(body.fromCity); const fromZip = clean(body.fromZip); const toCountry = clean(body.toCountry); const toCity = clean(body.toCity); const toZip = clean(body.toZip);
    const shipmentType = clean(body.shipmentType, 40); const weight = clean(body.weight, 40); const pieces = Number(body.pieces); const dimensions = clean(body.dimensions, 80); const pickupDate = clean(body.pickupDate, 20); const service = clean(body.service, 80) || 'Standard';
    const businessName = clean(body.businessName); const phone = clean(body.phone, 40); const senderName = clean(body.senderName); const senderEmail = email(body.senderEmail); const senderPhone = clean(body.senderPhone, 40);
    if (!customer || !customerEmail || !phone || !fromCountry || !fromCity || !fromZip || !toCountry || !toCity || !toZip || !shipmentType || !weight || !Number.isInteger(pieces) || pieces < 1 || !pickupDate) return NextResponse.json({ error: 'Complete all required booking fields.' }, { status: 400 });
    if ((body.senderEmail && !senderEmail) || (body.customerEmail && !customerEmail)) return NextResponse.json({ error: 'Enter valid customer and sender email addresses.' }, { status: 400 });
    const id = randomUUID();
    const trackingNumber = `SSC-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    await workspaceDb().runTransaction(async transaction => {
      transaction.create(root.collection('shipments').doc(id), { id, trackingNumber, customer, customerEmail, businessName, phone, senderName, senderEmail, senderPhone, fromCountry, fromCity, fromZip, toCountry, toCity, toZip, origin: `${fromCity}, ${fromCountry}`, destination: `${toCity}, ${toCountry}`, shipmentType, weight, pieces, dimensions, pickupDate, service, status: 'Booked', createdAt: now, updatedAt: now });
      transaction.create(root.collection('audit_logs').doc(), { actorId: ctx.ownerId, action: 'shipment.created', targetId: id, createdAt: now });
    });
    return NextResponse.json({ ok: true });
  }
  if (action === 'template-save') {
    const templateId = clean(body.templateId, 40); const subject = clean(body.subject, 200); const templateBody = clean(body.body, 8000);
    if (!templateIds.has(templateId) || !subject || !templateBody) return NextResponse.json({ error: 'Choose a valid template and complete its subject and message.' }, { status: 400 });
    await workspaceDb().runTransaction(async transaction => {
      transaction.set(root.collection('email_templates').doc(templateId), { subject, body: templateBody, updatedAt: now, updatedBy: ctx.ownerId }, { merge: true });
      transaction.create(root.collection('audit_logs').doc(), { actorId: ctx.ownerId, action: 'email_template.updated', targetId: templateId, createdAt: now });
    });
    return NextResponse.json({ ok: true, message: 'Email template saved.' });
  }
  if (action === 'notification-preview' || action === 'notification-send') {
    const shipmentId = clean(body.shipmentId, 80); const templateId = clean(body.templateId, 40); const recipientName = clean(body.recipientName); const to = email(body.to);
    if (!shipmentId || !templateIds.has(templateId)) return NextResponse.json({ error: 'Choose a shipment and email template.' }, { status: 400 });
    const [shipmentSnap, templateSnap] = await Promise.all([root.collection('shipments').doc(shipmentId).get(), root.collection('email_templates').doc(templateId).get()]);
    if (!shipmentSnap.exists) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 });
    const base = DEFAULT_TEMPLATES.find(item => item.id === templateId)!; const override = templateSnap.data(); const template = { ...base, ...override, id: base.id };
    const values = variables(ctx.site, shipmentSnap.data() || {}, recipientName, new URL(request.url).origin);
    const subject = fillPlaceholders(template.subject, values); const text = fillPlaceholders(template.body, values);
    const html = renderHtml(text, { companyName: ctx.site.name, trackingUrl: values.trackingUrl, logoUrl: ctx.site.logoDataUrl || `${new URL(request.url).origin}/images/email-logo.png` });
    if (action === 'notification-preview') return NextResponse.json({ preview: { subject, text, html } });
    if (!to) return NextResponse.json({ error: 'Enter a valid recipient email address.' }, { status: 400 });
    if (!emailConfigured()) return NextResponse.json({ error: `Email sending is not configured. ${emailConfigError() || ''}`.trim() }, { status: 503 });
    const result = await deliverEmail(to, { subject, text, html });
    const sendId = randomUUID();
    await root.collection('email_sends').doc(sendId).set({ id: sendId, shipmentId, trackingNumber: values.trackingNumber, templateId, templateName: template.name, to, subject, providerMessageId: result.id || null, status: result.ok ? 'sent' : 'failed', error: result.error || null, createdAt: now, actorId: ctx.ownerId });
    if (!result.ok) return NextResponse.json({ error: result.error || 'The email provider refused this message.' }, { status: 502 });
    return NextResponse.json({ ok: true, subject, to, message: `Notification sent to ${to}.` });
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
