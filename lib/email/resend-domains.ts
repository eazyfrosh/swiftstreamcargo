import 'server-only';

export type ResendDnsRecord = { record?: string; type: string; name: string; value: string; priority?: number | null; status?: string };
export type ResendDomain = { id: string; name: string; status: string; records: ResendDnsRecord[]; created_at?: string };

function key() { return process.env.RESEND_API_KEY?.trim() || ''; }
export function resendDomainConfigured() { return Boolean(key()); }

async function request(path: string, init?: RequestInit) {
  if (!key()) throw new Error('Email-domain setup is not configured on this deployment.');
  const response = await fetch(`https://api.resend.com${path}`, { ...init, headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json', ...(init?.headers || {}) }, cache: 'no-store' });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.message === 'string' ? body.message : 'Resend could not complete the domain request.');
  return body;
}

export async function createResendDomain(name: string): Promise<ResendDomain> {
  return await request('/domains', { method: 'POST', body: JSON.stringify({ name }) }) as unknown as ResendDomain;
}

export async function getResendDomain(id: string): Promise<ResendDomain> {
  return await request(`/domains/${encodeURIComponent(id)}`) as unknown as ResendDomain;
}

export async function verifyResendDomain(id: string): Promise<void> {
  await request(`/domains/${encodeURIComponent(id)}/verify`, { method: 'POST' });
}
