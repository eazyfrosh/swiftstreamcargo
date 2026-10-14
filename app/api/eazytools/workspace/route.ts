import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { currentOwner, readWorkspace, workspaceDb, workspaceId } from '@/lib/eazytools-workspace';
import { deliverEmail, emailConfigError, emailConfigured } from '@/lib/email';
import { DEFAULT_TEMPLATES, fillPlaceholders, renderHtml } from '@/lib/email/templates';
import { createResendDomain, getResendDomain, resendDomainConfigured, verifyResendDomain } from '@/lib/email/resend-domains';

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
    trackingUrl: `${origin}/site/${site?.siteId || ''}?tracking=${encodeURIComponent(shipment.trackingNumber || '')}#tracking`, companyName: site?.name || 'SwiftStream Cargo',
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
  const [shipments, audit, enquiries, chats, emailTemplates, emailSends, emailDomain] = await Promise.all([
    root.collection('shipments').orderBy('createdAt', 'desc').limit(50).get(),
    root.collection('audit_logs').orderBy('createdAt', 'desc').limit(12).get(),
    root.collection('enquiries').orderBy('createdAt', 'desc').limit(50).get(),
    root.collection('chats').orderBy('updatedAt', 'desc').limit(50).get(),
    root.collection('email_templates').get(),
    root.collection('email_sends').orderBy('createdAt', 'desc').limit(100).get(),
    root.collection('email_domains').doc('primary').get(),
  ]);
  return NextResponse.json({
    site: ctx.site,
    shipments: shipments.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    audit: audit.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    enquiries: enquiries.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    chats: chats.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    emailTemplates: mergeTemplates(emailTemplates.docs),
    emailSends: emailSends.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    emailConfigured: emailConfigured() || (resendDomainConfigured() && emailDomain.get('status') === 'verified' && Boolean(emailDomain.get('senderLocalPart'))),
    emailConfigError: emailDomain.get('status') === 'verified' && emailDomain.get('senderLocalPart') ? null : emailConfigError(),
    emailDomain: emailDomain.exists ? emailDomain.data() : null,
    resendDomainConfigured: resendDomainConfigured(),
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
  if (action === 'email-domain-create') {
    const domain = clean(body.domain, 253).toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return NextResponse.json({ error: 'Enter a valid domain, for example cargo.example.com.' }, { status: 400 });
    const ref = root.collection('email_domains').doc('primary');
    if ((await ref.get()).exists) return NextResponse.json({ error: 'A domain is already connected. Contact support before replacing it.' }, { status: 409 });
    try {
      const created = await createResendDomain(domain);
      await ref.set({ provider: 'resend', providerDomainId: created.id, domain: created.name || domain, status: created.status || 'pending', records: created.records || [], senderLocalPart: 'tracking', senderDisplayName: ctx.site.name, replyTo: ctx.site.email, createdAt: now, updatedAt: now });
      return NextResponse.json({ ok: true, message: 'Domain added. Add the DNS records below, then verify it.' });
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Domain could not be added.' }, { status: 502 }); }
  }
  if (action === 'email-domain-refresh') {
    const ref = root.collection('email_domains').doc('primary'); const saved = await ref.get(); const providerDomainId = saved.get('providerDomainId');
    if (!saved.exists || typeof providerDomainId !== 'string') return NextResponse.json({ error: 'Add your email domain first.' }, { status: 404 });
    try { await verifyResendDomain(providerDomainId); const current = await getResendDomain(providerDomainId); await ref.set({ status: current.status || 'pending', records: current.records || [], updatedAt: now }, { merge: true }); return NextResponse.json({ ok: true, message: current.status === 'verified' ? 'Domain verified. You can now send from it.' : 'Verification started. DNS changes can take a little time.' }); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Verification could not be checked.' }, { status: 502 }); }
  }
  if (action === 'email-sender-save') {
    const ref = root.collection('email_domains').doc('primary'); const saved = await ref.get();
    if (!saved.exists || saved.get('status') !== 'verified') return NextResponse.json({ error: 'Verify the domain before creating a sender.' }, { status: 400 });
    const senderLocalPart = clean(body.senderLocalPart, 64).toLowerCase(); const senderDisplayName = clean(body.senderDisplayName, 80).replace(/[\r\n"<>]/g, ''); const replyTo = email(body.replyTo);
    if (!/^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/.test(senderLocalPart) || !senderDisplayName || !replyTo) return NextResponse.json({ error: 'Enter a valid sender name, address, and reply-to email.' }, { status: 400 });
    await ref.set({ senderLocalPart, senderDisplayName, replyTo, updatedAt: now }, { merge: true });
    return NextResponse.json({ ok: true, message: `Sender saved as ${senderLocalPart}@${saved.get('domain')}.` });
  }
  if (action === 'shipment-create') {
    const customer = clean(body.customer); const customerEmail = email(body.customerEmail); const fromCountry = clean(body.fromCountry); const fromCity = clean(body.fromCity); const fromZip = clean(body.fromZip); const toCountry = clean(body.toCountry); const toCity = clean(body.toCity); const toZip = clean(body.toZip);
    const shipmentType = clean(body.shipmentType, 40); const weight = clean(body.weight, 40); const pieces = Number(body.pieces); const packageLength = Number(body.packageLength); const packageWidth = Number(body.packageWidth); const packageHeight = Number(body.packageHeight); const dimensionUnit = clean(body.dimensionUnit, 4); const dimensions = `${packageLength} × ${packageWidth} × ${packageHeight} ${dimensionUnit}`; const pickupDate = clean(body.pickupDate, 20); const service = clean(body.service, 80) || 'Standard';
    const businessName = clean(body.businessName); const phone = clean(body.phone, 40); const senderName = clean(body.senderName); const senderEmail = email(body.senderEmail); const senderPhone = clean(body.senderPhone, 40);
    if (!customer || !customerEmail || !phone || !fromCountry || !fromCity || !fromZip || !toCountry || !toCity || !toZip || !shipmentType || !weight || !Number.isInteger(pieces) || pieces < 1 || !Number.isFinite(packageLength) || packageLength <= 0 || !Number.isFinite(packageWidth) || packageWidth <= 0 || !Number.isFinite(packageHeight) || packageHeight <= 0 || !['in', 'cm'].includes(dimensionUnit) || !pickupDate) return NextResponse.json({ error: 'Complete all required booking fields, including length, width, and height.' }, { status: 400 });
    if ((body.senderEmail && !senderEmail) || (body.customerEmail && !customerEmail)) return NextResponse.json({ error: 'Enter valid customer and sender email addresses.' }, { status: 400 });
    const id = randomUUID();
    const trackingNumber = `SSC-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    await workspaceDb().runTransaction(async transaction => {
      transaction.create(root.collection('shipments').doc(id), { id, trackingNumber, customer, customerEmail, businessName, phone, senderName, senderEmail, senderPhone, fromCountry, fromCity, fromZip, toCountry, toCity, toZip, origin: `${fromCity}, ${fromCountry}`, destination: `${toCity}, ${toCountry}`, shipmentType, weight, pieces, packageLength, packageWidth, packageHeight, dimensionUnit, dimensions, pickupDate, service, status: 'Booked', createdAt: now, updatedAt: now });
      // Public tracking performs a point read through this non-sensitive index.
      // Recipient details remain only inside the owner's private workspace.
      transaction.create(workspaceDb().collection('workspaceTracking').doc(trackingNumber), { siteId: ctx.siteId, shipmentId: id, createdAt: now });
      transaction.create(root.collection('audit_logs').doc(), { actorId: ctx.ownerId, action: 'shipment.created', targetId: id, createdAt: now });
    });
    return NextResponse.json({ ok: true, trackingNumber, message: `Shipment created successfully. Tracking number: ${trackingNumber}` });
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
    const publicOrigin = new URL(request.url).origin;
    const logoUrl = ctx.site.logoDataUrl ? `${publicOrigin}/api/eazytools/logo?site=${ctx.siteId}` : `${publicOrigin}/images/email-logo.png`;
    const html = renderHtml(text, { companyName: ctx.site.name, trackingUrl: values.trackingUrl, logoUrl });
    if (action === 'notification-preview') return NextResponse.json({ preview: { subject, text, html } });
    if (!to) return NextResponse.json({ error: 'Enter a valid recipient email address.' }, { status: 400 });
    const domainSnap = await root.collection('email_domains').doc('primary').get();
    const customSender = domainSnap.exists && domainSnap.get('status') === 'verified' && domainSnap.get('senderLocalPart') && domainSnap.get('domain') ? `${domainSnap.get('senderDisplayName') || ctx.site.name} <${domainSnap.get('senderLocalPart')}@${domainSnap.get('domain')}>` : '';
    if (!customSender && !emailConfigured()) return NextResponse.json({ error: `Email sending is not configured. ${emailConfigError() || ''}`.trim() }, { status: 503 });
    const result = await deliverEmail(to, { subject, text, html }, customSender ? { from: customSender, replyTo: domainSnap.get('replyTo') || ctx.site.email } : {});
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
