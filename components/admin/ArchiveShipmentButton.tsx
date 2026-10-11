'use client';
import { Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ArchiveShipmentButton({ trackingNumber }: { trackingNumber: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function archive() { if (!window.confirm('Archive this shipment? It will no longer be available on public tracking.')) return; setBusy(true); setError(''); const response = await fetch(`/api/admin/shipments/${encodeURIComponent(trackingNumber)}`, { method: 'DELETE' }).catch(() => null); if (!response?.ok) { setError('Could not archive the shipment.'); setBusy(false); return; } router.push('/admin/shipments'); router.refresh(); }
  return <div><button onClick={archive} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"><Archive className="h-4 w-4" />{busy ? 'Archiving…' : 'Archive shipment'}</button>{error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}</div>;
}
