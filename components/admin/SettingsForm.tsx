'use client';

import { useState, type FormEvent } from 'react';
import type { WebsiteConfig } from '@/lib/operations';

export function SettingsForm({ initial }: { initial: WebsiteConfig }) {
  const [form, setForm] = useState(initial);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const fields: Array<[keyof WebsiteConfig, string, string]> = [['name', 'Company name', 'Swiftstream Cargo'], ['tagline', 'Tagline', 'Cargo in motion. Confidence at every mile.'], ['email', 'Public email', 'hello@example.com'], ['phone', 'Public phone', '+1 555 0100'], ['address', 'Office address', 'Street, city, country'], ['hours', 'Business hours', 'Monday–Friday, 8:00–17:00']];
  async function submit(event: FormEvent) { event.preventDefault(); setState('saving'); const response = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).catch(() => null); setState(response?.ok ? 'saved' : 'error'); }
  return <form onSubmit={submit} className="mt-8 max-w-3xl rounded-2xl border border-ink-200 bg-surface p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2">{fields.map(([key, label, placeholder]) => <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}><label htmlFor={`setting-${key}`} className="text-sm font-medium text-ink-700">{label}</label><input id={`setting-${key}`} required value={form[key]} placeholder={placeholder} onChange={(event) => { setForm((current) => ({ ...current, [key]: event.target.value })); setState('idle'); }} className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-surface px-3.5 text-sm text-ink-900" /></div>)}</div><div className="mt-6 flex items-center gap-4"><button disabled={state === 'saving'} className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-night-950 hover:bg-brand-400 disabled:opacity-60">{state === 'saving' ? 'Saving…' : 'Save settings'}</button>{state === 'saved' && <p role="status" className="text-sm text-emerald-700">Saved. Public pages will use the new details.</p>}{state === 'error' && <p role="alert" className="text-sm text-rose-600">Could not save. Check Firebase configuration.</p>}</div></form>;
}
