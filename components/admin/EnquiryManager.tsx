'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Enquiry, EnquiryStatus } from '@/lib/operations';

const STATUSES: Array<{ value: EnquiryStatus; label: string }> = [
  { value: 'new', label: 'New' }, { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' }, { value: 'archived', label: 'Archived' },
];

export function EnquiryManager({ initial }: { initial: Enquiry[] }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const filtered = useMemo(() => items.filter((item) => `${item.name} ${item.email} ${item.company} ${item.origin} ${item.destination} ${item.message}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  async function update(id: string, status: EnquiryStatus) {
    setError('');
    const response = await fetch(`/api/admin/enquiries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(() => null);
    if (!response?.ok) { setError('Could not update that enquiry.'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }

  return <>
    <div className="relative mt-7 max-w-md"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search enquiries" className="h-11 w-full rounded-xl border border-ink-200 bg-surface pl-10 pr-4 text-sm text-ink-900" /></div>
    {error && <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}
    {filtered.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-ink-500">No enquiries match this view.</div> :
      <ul className="mt-6 space-y-4">{filtered.map((item) => <li key={item.id} className="rounded-2xl border border-ink-200 bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase text-brand-700">{item.kind}</span><time className="text-xs text-ink-400">{new Date(item.createdAt).toLocaleString()}</time></div><h2 className="mt-3 font-display text-lg font-semibold text-ink-900">{item.name}</h2><p className="text-sm text-ink-500">{item.email}{item.company ? ` · ${item.company}` : ''}</p></div>
          <select aria-label={`Status for ${item.name}`} value={item.status} onChange={(event) => update(item.id, event.target.value as EnquiryStatus)} className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-800">{STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div>
        {(item.origin || item.destination) && <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm font-medium text-ink-700">{item.origin} → {item.destination} · {item.shipmentType}</p>}
        {item.topic && <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Topic: {item.topic}</p>}
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">{item.message || 'No additional details provided.'}</p>
      </li>)}</ul>}
  </>;
}
