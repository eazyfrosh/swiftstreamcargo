import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase/admin';

export const OWNER_COOKIE = 'swiftstream_eazytools_owner';

export interface CargoTemplateSettings {
  siteId: string;
  ownerId: string;
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logoDataUrl: string;
  primaryColor: string;
  darkColor: string;
  copyrightText: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  telegramEnabled: boolean;
  telegramUrl: string;
  updatedAt: string;
}

function secret() {
  const value = process.env.EAZYTOOLS_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('EAZYTOOLS_SESSION_SECRET must contain at least 32 characters.');
  return value;
}

const sign = (value: string) => createHmac('sha256', secret()).update(value).digest('base64url');

export function workspaceId(ownerId: string) {
  return createHmac('sha256', secret()).update(`swiftstream-cargo\0${ownerId}`).digest('hex').slice(0, 24);
}

export function createOwnerSession(ownerId: string) {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const value = `${ownerId}.${expiresAt}`;
  return `${value}.${sign(value)}`;
}

export function verifyOwnerSession(raw?: string) {
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3 || Number(parts[1]) < Date.now()) return null;
  const value = `${parts[0]}.${parts[1]}`;
  const expected = sign(value);
  if (expected.length !== parts[2].length || !timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2]))) return null;
  return parts[0];
}

export async function currentOwner() {
  return verifyOwnerSession((await cookies()).get(OWNER_COOKIE)?.value);
}

export function defaultSettings(siteId: string, ownerId = ''): CargoTemplateSettings {
  return {
    siteId, ownerId, name: 'SwiftStream Cargo', tagline: 'Cargo in motion. Confidence at every mile.',
    email: 'hello@swiftstreamcargo.com', phone: '+1 (312) 555-0142',
    address: '210 Harbor Point Drive, Suite 900, Chicago, IL 60601', logoDataUrl: '',
    primaryColor: '#ff6a00', darkColor: '#04071a',
    copyrightText: `© ${new Date().getFullYear()} SwiftStream Cargo. All rights reserved.`,
    whatsappEnabled: false, whatsappNumber: '', telegramEnabled: false, telegramUrl: '',
    updatedAt: new Date().toISOString(),
  };
}

export function workspaceDb() {
  const db = adminDb();
  if (!db) throw new Error('Firebase Admin is not configured.');
  return db;
}

export async function readWorkspace(siteId: string) {
  if (!/^[a-f0-9]{24}$/.test(siteId)) return null;
  const snap = await workspaceDb().collection('premiumTemplateSites').doc(siteId).get();
  if (!snap.exists || snap.get('templateId') !== 'swiftstream-cargo') return null;
  return { ...defaultSettings(siteId), ...snap.data(), siteId } as CargoTemplateSettings;
}

const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f]/g, '').slice(0, max) : '';
const color = (value: unknown, fallback: string) => /^#[0-9a-f]{6}$/i.test(text(value, 7)) ? text(value, 7) : fallback;

export function cleanSettings(raw: unknown, siteId: string, ownerId: string): CargoTemplateSettings {
  const body = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const logoDataUrl = text(body.logoDataUrl, 400_000);
  if (logoDataUrl && !/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(logoDataUrl)) throw new Error('Use a PNG, JPG, or WebP logo.');
  const whatsappNumber = text(body.whatsappNumber, 30);
  if (whatsappNumber && !/^\+?[0-9 ()-]+$/.test(whatsappNumber)) throw new Error('Enter a valid WhatsApp number.');
  const telegramUrl = text(body.telegramUrl, 200);
  if (telegramUrl && !/^https:\/\/(t\.me|telegram\.me)\//.test(telegramUrl)) throw new Error('Use a valid Telegram link.');
  return {
    siteId, ownerId, name: text(body.name, 80) || 'SwiftStream Cargo',
    tagline: text(body.tagline, 160) || 'Cargo in motion. Confidence at every mile.',
    email: text(body.email, 180) || 'hello@swiftstreamcargo.com', phone: text(body.phone, 60),
    address: text(body.address, 240), logoDataUrl,
    primaryColor: color(body.primaryColor, '#ff6a00'), darkColor: color(body.darkColor, '#04071a'),
    copyrightText: text(body.copyrightText, 180) || `© ${new Date().getFullYear()} SwiftStream Cargo. All rights reserved.`,
    whatsappEnabled: body.whatsappEnabled === true, whatsappNumber,
    telegramEnabled: body.telegramEnabled === true, telegramUrl,
    updatedAt: new Date().toISOString(),
  };
}
