import 'server-only';

import { createHash, randomUUID } from 'crypto';
import { adminDb } from './firebase/admin';

export type EnquiryKind = 'quote' | 'contact';
export type EnquiryStatus = 'new' | 'in_progress' | 'resolved' | 'archived';

export interface Enquiry {
  id: string;
  kind: EnquiryKind;
  status: EnquiryStatus;
  name: string;
  email: string;
  company: string;
  origin?: string;
  destination?: string;
  shipmentType?: string;
  topic?: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteConfig {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
}

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  name: 'Swiftstream Cargo',
  tagline: 'Cargo in motion. Confidence at every mile.',
  email: 'hello@swiftstreamcargo.com',
  phone: '+1 (312) 555-0142',
  address: '210 Harbor Point Drive, Suite 900, Chicago, IL 60601',
  hours: 'Monday–Friday, 8:00–17:00',
};

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f]/g, '').slice(0, max) : '';

export function validatePublicEnquiry(kind: EnquiryKind, raw: unknown) {
  if (!raw || typeof raw !== 'object') return { error: 'Invalid form submission.' } as const;
  const data = raw as Record<string, unknown>;
  if (clean(data.website, 100)) return { error: 'Invalid form submission.' } as const;
  const startedAt = Number(data.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1500 || Date.now() - startedAt > 86_400_000) {
    return { error: 'Please reload the page and try again.' } as const;
  }

  const name = clean(data.name, 100);
  const email = clean(data.email, 180).toLowerCase();
  const company = clean(data.company, 140);
  const message = clean(kind === 'quote' ? data.details : data.message, 2000);
  if (name.length < 2) return { error: 'Enter your name.' } as const;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'Enter a valid email address.' } as const;

  if (kind === 'quote') {
    const origin = clean(data.origin, 160);
    const destination = clean(data.destination, 160);
    const shipmentType = clean(data.shipmentType, 80);
    if (!origin || !destination || !shipmentType) return { error: 'Complete the shipment route and type.' } as const;
    return { value: { name, email, company, message, origin, destination, shipmentType } } as const;
  }

  const topic = clean(data.topic, 80);
  if (!topic || message.length < 15) return { error: 'Choose a topic and add a little more detail.' } as const;
  return { value: { name, email, company, message, topic } } as const;
}

export async function rateLimitPublicForm(ip: string, kind: EnquiryKind) {
  const db = adminDb();
  if (!db) return false;
  const key = createHash('sha256').update(`${kind}:${ip}`).digest('hex');
  const ref = db.collection('publicFormRateLimits').doc(key);
  const now = Date.now();
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.data() as { windowStarted?: number; count?: number } | undefined;
    const fresh = !data?.windowStarted || now - data.windowStarted > 60 * 60 * 1000;
    const count = fresh ? 0 : data?.count ?? 0;
    if (count >= 5) return false;
    transaction.set(ref, { windowStarted: fresh ? now : data?.windowStarted, count: count + 1 }, { merge: true });
    return true;
  });
}

export async function createEnquiry(kind: EnquiryKind, value: Record<string, string | undefined>) {
  const db = adminDb();
  if (!db) return null;
  const now = new Date().toISOString();
  const id = randomUUID();
  const enquiry: Enquiry = { id, kind, status: 'new', name: value.name ?? '', email: value.email ?? '', company: value.company ?? '', message: value.message ?? '', origin: value.origin, destination: value.destination, shipmentType: value.shipmentType, topic: value.topic, createdAt: now, updatedAt: now };
  await db.collection('enquiries').doc(id).set(enquiry);
  return enquiry;
}

export async function listEnquiries(): Promise<Enquiry[]> {
  const db = adminDb();
  if (!db) return [];
  const snap = await db.collection('enquiries').orderBy('createdAt', 'desc').limit(250).get();
  return snap.docs.map((doc) => doc.data() as Enquiry);
}

export async function updateEnquiry(id: string, status: EnquiryStatus) {
  const db = adminDb();
  if (!db) return false;
  await db.collection('enquiries').doc(id).update({ status, updatedAt: new Date().toISOString() });
  return true;
}

export async function writeAudit(actor: string, action: string, target: string, details = '') {
  const db = adminDb();
  if (!db) return;
  await db.collection('auditLog').add({ actor, action, target, details: clean(details, 500), at: new Date().toISOString() });
}

export async function listAuditLog() {
  const db = adminDb();
  if (!db) return [];
  const snap = await db.collection('auditLog').orderBy('at', 'desc').limit(150).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Array<{ id: string; actor: string; action: string; target: string; details: string; at: string }>;
}

export async function getWebsiteConfig(): Promise<WebsiteConfig> {
  const db = adminDb();
  if (!db) return DEFAULT_WEBSITE_CONFIG;
  const snap = await db.collection('settings').doc('website').get();
  const data = snap.data() as Partial<WebsiteConfig> | undefined;
  const merged = { ...DEFAULT_WEBSITE_CONFIG, ...data };
  // Transparently replace the original starter identity while preserving any
  // genuinely customised values already saved by an administrator.
  if (data?.name === 'FreightBridge Logistics') merged.name = DEFAULT_WEBSITE_CONFIG.name;
  if (data?.tagline?.toLowerCase() === 'move freight. build connections.') merged.tagline = DEFAULT_WEBSITE_CONFIG.tagline;
  if (data?.email === 'hello@freightbridge.com') merged.email = DEFAULT_WEBSITE_CONFIG.email;
  return merged;
}

export async function saveWebsiteConfig(raw: unknown) {
  if (!raw || typeof raw !== 'object') return { error: 'Invalid settings.' } as const;
  const data = raw as Record<string, unknown>;
  const value: WebsiteConfig = {
    name: clean(data.name, 100), tagline: clean(data.tagline, 160), email: clean(data.email, 180),
    phone: clean(data.phone, 60), address: clean(data.address, 240), hours: clean(data.hours, 120),
  };
  if (!value.name || !value.email || !value.phone || !value.address) return { error: 'Name, email, phone, and address are required.' } as const;
  const db = adminDb();
  if (!db) return { error: 'Firestore is not configured.' } as const;
  await db.collection('settings').doc('website').set(value, { merge: true });
  return { value } as const;
}
