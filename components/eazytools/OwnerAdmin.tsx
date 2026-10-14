'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import {
  AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, ExternalLink, FileClock,
  Eye, Inbox, LayoutDashboard, Loader2, Mail, Menu, MessageCircle, PackagePlus, Palette,
  Send, Settings, Truck, X,
} from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import type { CargoTemplateSettings } from '@/lib/eazytools-workspace';

type Shipment = { id: string; trackingNumber: string; customer: string; customerEmail?: string; businessName?: string; phone?: string; origin: string; destination: string; service?: string; shipmentType?: string; weight?: string; pieces?: number; dimensions?: string; pickupDate?: string; status: string; createdAt: string };
type Audit = { id: string; action: string; targetId?: string; status?: string; createdAt: string };
type Enquiry = { id: string; name?: string; email?: string; message?: string; status?: string; createdAt: string };
type Chat = { id: string; customer?: string; email?: string; lastMessage?: string; status?: string; updatedAt?: string };
type EmailTemplate = { id: string; name: string; description: string; subject: string; body: string; updatedAt?: string };
type EmailSend = { id: string; shipmentId: string; templateName: string; to: string; subject: string; status: string; error?: string | null; createdAt: string };
type Data = { site: CargoTemplateSettings; shipments: Shipment[]; audit: Audit[]; enquiries: Enquiry[]; chats: Chat[]; emailTemplates: EmailTemplate[]; emailSends: EmailSend[]; emailConfigured: boolean; emailConfigError: string | null };
type Section = 'overview' | 'shipments' | 'chat' | 'book' | 'templates' | 'enquiries' | 'settings' | 'audit';

const NAV = [
  { id: 'overview' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shipments' as const, label: 'Shipments', icon: Truck },
  { id: 'chat' as const, label: 'Live chat', icon: MessageCircle },
  { id: 'book' as const, label: 'Book shipment', icon: PackagePlus },
  { id: 'templates' as const, label: 'Email templates', icon: Mail },
  { id: 'enquiries' as const, label: 'Enquiries', icon: ClipboardList },
  { id: 'settings' as const, label: 'Website settings', icon: Settings },
  { id: 'audit' as const, label: 'Audit log', icon: FileClock },
];
const statusOptions = ['Booked', 'Picked up', 'In transit', 'At facility', 'Out for delivery', 'Delivered', 'Exception'];
const validSections = new Set<Section>(NAV.map(item => item.id));

export function OwnerAdmin() {
  const [data, setData] = useState<Data | null>(null);
  const [active, setActive] = useState<Section>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setMessage('');
    fetch('/api/eazytools/workspace', { cache: 'no-store' }).then(async response => {
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setData(value);
    }).catch(error => setMessage(error instanceof Error ? error.message : 'Admin could not be loaded.'));
  }, []);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section') as Section | null;
    if (section && validSections.has(section)) setActive(section);
    load();
  }, [load]);

  function navigate(section: Section) {
    setActive(section); setMenuOpen(false);
    window.history.replaceState(null, '', section === 'overview' ? '/owner-admin' : `/owner-admin?section=${section}`);
  }

  async function action(payload: Record<string, string>) {
    setBusy(true); setMessage('Saving…');
    try {
      const response = await fetch('/api/eazytools/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setMessage(value.message || 'Saved successfully.');
      load();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request could not be completed.');
      return false;
    } finally { setBusy(false); }
  }

  if (!data) return <main className="grid min-h-screen place-items-center bg-night-950 px-5 text-center text-white">{message || <Loader2 className="animate-spin" />}</main>;

  const sidebar = <div className="flex h-full flex-col">
    <div className="flex h-[68px] items-center gap-2.5 border-b border-night-800 px-5"><LogoMark /><span className="min-w-0"><span className="block truncate font-display text-[.85rem] font-semibold leading-tight text-white">{data.site.name}</span><span className="block text-[.62rem] font-semibold uppercase tracking-[.12em] text-ink-400">Private operations</span></span></div>
    <nav aria-label="Workspace admin" className="flex-1 overflow-y-auto px-3 py-4"><ul className="flex flex-col gap-1">{NAV.map(item => <li key={item.id}><button onClick={() => navigate(item.id)} aria-current={active === item.id ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[.94rem] font-medium transition-colors ${active === item.id ? 'bg-brand-500 text-night-950' : 'text-ink-300 hover:bg-night-800 hover:text-white'}`}><item.icon className="h-[1.1rem] w-[1.1rem]" />{item.label}</button></li>)}</ul></nav>
    <div className="border-t border-night-800 p-3"><p className="truncate px-2 pb-2 text-xs text-ink-500">Workspace {data.site.siteId}</p><a href="/template-editor" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[.94rem] font-medium text-ink-300 hover:bg-night-800 hover:text-white"><Palette className="h-[1.1rem] w-[1.1rem]" />Website editor</a><a href={`/site/${data.site.siteId}`} target="_blank" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[.94rem] font-medium text-ink-300 hover:bg-night-800 hover:text-white"><ExternalLink className="h-[1.1rem] w-[1.1rem]" />Open website</a></div>
  </div>;

  return <div className="min-h-screen bg-ink-50">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] bg-night-950 lg:block">{sidebar}</aside>
    {menuOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close menu" className="absolute inset-0 h-full w-full bg-night-950/60" onClick={() => setMenuOpen(false)} /><aside className="absolute inset-y-0 left-0 w-[268px] bg-night-950"><button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-ink-300 hover:bg-night-800"><X className="h-5 w-5" /></button>{sidebar}</aside></div>}
    <div className="lg:pl-[248px]"><header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-ink-200 bg-surface px-5 lg:hidden"><button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-lg border border-ink-200 text-ink-700"><Menu className="h-5 w-5" /></button><span className="truncate font-display font-semibold text-ink-900">{data.site.name} Operations</span></header>
      <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10"><div className="mx-auto max-w-6xl">
        {active === 'overview' && <Overview data={data} navigate={navigate} />}
        {active === 'shipments' && <Shipments data={data} action={action} busy={busy} />}
        {active === 'book' && <BookShipment action={action} busy={busy} onCreated={() => navigate('shipments')} />}
        {active === 'chat' && <CollectionView title="Live chat" description="Customer conversations for this website only." empty="No customer conversations yet." items={data.chats.map(item => ({ id: item.id, title: item.customer || item.email || 'Website visitor', detail: item.lastMessage || 'No message preview', meta: item.status || 'Open' }))} />}
        {active === 'enquiries' && <CollectionView title="Enquiries" description="Quote and contact requests submitted to your website." empty="No enquiries have been received yet." items={data.enquiries.map(item => ({ id: item.id, title: item.name || item.email || 'Website visitor', detail: item.message || 'No message preview', meta: item.status || 'New' }))} />}
        {active === 'templates' && <EmailTemplates templates={data.emailTemplates} action={action} busy={busy} />}
        {active === 'settings' && <WebsiteSettings site={data.site} />}
        {active === 'audit' && <AuditLog entries={data.audit} />}
        {message && <p role="status" className="mt-6 rounded-xl border border-ink-200 bg-surface p-4 text-sm text-ink-600">{message}</p>}
      </div></main>
    </div>
  </div>;
}

function Overview({ data, navigate }: { data: Data; navigate: (section: Section) => void }) {
  const inTransit = data.shipments.filter(item => !['Delivered', 'Exception'].includes(item.status)).length;
  const cards = [
    { label: 'Open shipments', value: inTransit, icon: Truck, tone: 'bg-brand-50 text-brand-700' },
    { label: 'Delivered', value: data.shipments.filter(item => item.status === 'Delivered').length, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Exceptions', value: data.shipments.filter(item => item.status === 'Exception').length, icon: AlertTriangle, tone: 'bg-rose-50 text-rose-700' },
    { label: 'New enquiries', value: data.enquiries.filter(item => (item.status || 'new').toLowerCase() === 'new').length, icon: Inbox, tone: 'bg-ink-100 text-ink-700' },
  ];
  return <><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand-700">Private EazyTool workspace</p><h1 className="mt-2 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Operations overview</h1><p className="mt-1.5 text-[.95rem] text-ink-500">Everything moving through your logistics website right now.</p></div><button onClick={() => navigate('book')} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-[.95rem] font-semibold text-night-950"><PackagePlus className="h-4 w-4" />Book shipment</button></div>
    <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <div key={card.label} className="rounded-2xl border border-ink-200 bg-surface p-5"><span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}><card.icon className="h-4 w-4" /></span><dd className="mt-3 font-display text-[1.75rem] font-semibold leading-none text-ink-900">{card.value}</dd><dt className="mt-1.5 text-[.85rem] font-medium text-ink-500">{card.label}</dt></div>)}</dl>
    <section className="mt-10"><div className="flex items-end justify-between"><h2 className="font-display text-lg font-semibold text-ink-900">Recent shipments</h2><button onClick={() => navigate('shipments')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">View all <ArrowRight className="h-4 w-4" /></button></div><ShipmentList shipments={data.shipments.slice(0, 5)} /></section></>;
}

function Shipments({ data, action, busy }: { data: Data; action: (payload: Record<string, string>) => Promise<boolean>; busy: boolean }) {
  const [selectedId, setSelectedId] = useState('');
  const selected = data.shipments.find(item => item.id === selectedId);
  return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Shipments</h1><p className="mt-1.5 text-[.95rem] text-ink-500">Every booking in your private network, newest first. Open a shipment to preview and send a branded customer email.</p><div className="mt-6 overflow-hidden rounded-2xl border border-ink-200 bg-surface">{data.shipments.length ? <div className="divide-y divide-ink-100">{data.shipments.map(item => <article key={item.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><p className="font-mono text-sm font-semibold text-ink-900">{item.trackingNumber}</p><p className="mt-1 text-sm font-medium text-ink-700">{item.customer}</p><p className="mt-1 text-sm text-ink-500">{item.origin} → {item.destination}{item.service ? ` · ${item.service}` : ''}</p></div><select disabled={busy} value={item.status} onChange={event => action({ action: 'shipment-status', id: item.id, status: event.target.value })} className="rounded-xl border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-800">{statusOptions.map(status => <option key={status}>{status}</option>)}</select><button onClick={() => setSelectedId(current => current === item.id ? '' : item.id)} className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-800 hover:border-brand-500">{selectedId === item.id ? 'Close' : 'Open & notify'}</button></article>)}</div> : <Empty icon={Truck} text="No shipments yet. Book one and it will appear here." />}</div>{selected && <NotifyCustomer shipment={selected} site={data.site} templates={data.emailTemplates} history={data.emailSends.filter(entry => entry.shipmentId === selected.id)} configured={data.emailConfigured} configError={data.emailConfigError} action={action} busy={busy} />}</>;
}

function ShipmentList({ shipments }: { shipments: Shipment[] }) { return <ul className="mt-3 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-surface">{shipments.length ? shipments.map(item => <li key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><span><span className="font-mono text-sm font-semibold text-ink-900">{item.trackingNumber}</span><span className="mt-0.5 block text-sm text-ink-500">{item.origin} → {item.destination}</span></span><span className="w-fit rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700">{item.status}</span></li>) : <li><Empty icon={Truck} text="No shipments yet." /></li>}</ul>; }

function BookShipment({ action, busy, onCreated }: { action: (payload: Record<string, string>) => Promise<boolean>; busy: boolean; onCreated: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const payload: Record<string, string> = { action: 'shipment-create' }; for (const [key, value] of form.entries()) payload[key] = String(value); const ok = await action(payload); if (ok) { event.currentTarget.reset(); onCreated(); } }
  const field = 'w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-ink-900 outline-none focus:border-brand-500';
  const countries = ['United States','Canada','United Kingdom','Germany','Netherlands','France','Spain','United Arab Emirates','Nigeria','Other'];
  return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Book a shipment</h1><p className="mt-1.5 max-w-2xl text-[.95rem] text-ink-500">Create a complete booking for your customer. The generated reference works immediately.</p><form onSubmit={submit} className="mt-8 rounded-[2rem] border border-ink-200 bg-surface p-5 shadow-card sm:p-8">
    <div className="grid gap-6 lg:grid-cols-2"><fieldset className="rounded-3xl border border-ink-100 bg-ink-50/40 p-5"><legend className="px-2 text-sm font-semibold uppercase tracking-[.14em] text-ink-700">From</legend><div className="mt-4 grid gap-4"><Label text="Country *"><select name="fromCountry" required className={field}><option value="">Select country</option>{countries.map(country => <option key={country}>{country}</option>)}</select></Label><div className="grid gap-4 sm:grid-cols-2"><Label text="City *"><input name="fromCity" required className={field} placeholder="Chicago" /></Label><Label text="ZIP / Postal code *"><input name="fromZip" required className={field} placeholder="60601" /></Label></div></div></fieldset>
    <fieldset className="rounded-3xl border border-ink-100 bg-ink-50/40 p-5"><legend className="px-2 text-sm font-semibold uppercase tracking-[.14em] text-ink-700">To</legend><div className="mt-4 grid gap-4"><Label text="Country *"><select name="toCountry" required className={field}><option value="">Select country</option>{countries.map(country => <option key={country}>{country}</option>)}</select></Label><div className="grid gap-4 sm:grid-cols-2"><Label text="City *"><input name="toCity" required className={field} placeholder="Dallas" /></Label><Label text="ZIP / Postal code *"><input name="toZip" required className={field} placeholder="75201" /></Label></div></div></fieldset></div>
    <section className="mt-8 border-t border-ink-100 pt-8"><h2 className="text-sm font-semibold uppercase tracking-[.14em] text-ink-700">Shipment details</h2><Label text="Shipment type *"><div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-5">{['Parcel','Pallet','LTL','FTL','Container'].map((type,index) => <label key={type} className="cursor-pointer"><input className="peer sr-only" type="radio" name="shipmentType" value={type} defaultChecked={index === 1} /><span className="block rounded-xl border border-ink-200 px-3 py-3 text-center text-sm peer-checked:border-brand-500 peer-checked:text-brand-700">{type}</span></label>)}</div></Label><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Label text="Weight *"><input name="weight" required className={field} placeholder="1,200 lb" /></Label><Label text="Pieces *"><input name="pieces" type="number" min="1" defaultValue="1" required className={field} /></Label><Label text="Dimensions"><input name="dimensions" className={field} placeholder="48 × 40 × 52 in" /></Label><Label text="Pickup date *"><input name="pickupDate" type="date" required className={field} /></Label></div><div className="mt-5 max-w-sm"><Label text="Service *"><select name="service" className={field}><option>Standard — 4 days</option><option>Express — 2 days</option><option>Priority — next day</option></select></Label></div></section>
    <section className="mt-8 border-t border-ink-100 pt-8"><h2 className="text-sm font-semibold uppercase tracking-[.14em] text-ink-700">How we reach the recipient</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Label text="Name *"><input name="customer" required className={field} placeholder="Amara Okafor" /></Label><Label text="Business name"><input name="businessName" className={field} placeholder="Northline Supply Co." /></Label><Label text="Email *"><input name="customerEmail" type="email" required className={field} placeholder="you@company.com" /></Label><Label text="Phone *"><input name="phone" required className={field} placeholder="+1 (312) 555-0142" /></Label></div></section>
    <section className="mt-8 border-t border-ink-100 pt-8"><h2 className="text-sm font-semibold uppercase tracking-[.14em] text-ink-700">Sender details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Label text="Sender name"><input name="senderName" className={field} placeholder="Warehouse team" /></Label><Label text="Sender email"><input name="senderEmail" type="email" className={field} placeholder="dispatch@company.com" /></Label><Label text="Sender phone"><input name="senderPhone" className={field} placeholder="+1 555 000 0000" /></Label></div></section>
    <div className="mt-8 flex flex-col gap-4 border-t border-ink-100 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-sm text-ink-500">This creates the shipment and allocates a tracking number the customer can use immediately.</p><button disabled={busy} className="h-[50px] rounded-xl bg-brand-500 px-7 font-semibold text-night-950 disabled:opacity-60">{busy ? 'Booking…' : 'Book shipment →'}</button></div></form></>;
}

function EmailTemplates({ templates, action, busy }: { templates: EmailTemplate[]; action: (payload: Record<string, string>) => Promise<boolean>; busy: boolean }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id || 'booked'); const selected = templates.find(item => item.id === selectedId) || templates[0];
  const [subject, setSubject] = useState(selected?.subject || ''); const [body, setBody] = useState(selected?.body || '');
  function choose(template: EmailTemplate) { setSelectedId(template.id); setSubject(template.subject); setBody(template.body); }
  const tokens = ['recipientName','trackingNumber','status','service','origin','destination','currentLocation','carrier','pieces','weight','estimatedDelivery','trackingUrl','companyName'];
  if (!selected) return <Empty icon={Mail} text="No email templates are available." />;
  return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Email templates</h1><p className="mt-1.5 text-[.95rem] text-ink-500">The wording customers receive about their shipments. Each template belongs only to this workspace.</p><div className="mt-8 grid gap-5 lg:grid-cols-[190px_1fr]"><nav className="flex gap-2 overflow-x-auto lg:flex-col">{templates.map(template => <button key={template.id} onClick={() => choose(template)} className={`shrink-0 rounded-xl px-3 py-2 text-left text-sm font-medium ${template.id === selectedId ? 'bg-brand-500 text-night-950' : 'bg-ink-100 text-ink-800'}`}>{template.name}</button>)}</nav><div><form onSubmit={event => { event.preventDefault(); void action({ action: 'template-save', templateId: selectedId, subject, body }); }} className="space-y-5 rounded-2xl border border-ink-200 bg-surface p-5 sm:p-7"><div><h2 className="text-xl font-semibold text-ink-900">{selected.name}</h2><p className="mt-1 text-sm text-ink-500">{selected.description}</p></div><Label text="Subject"><input value={subject} onChange={event => setSubject(event.target.value)} required className="w-full rounded-xl border border-ink-200 px-4 py-3" /></Label><Label text="Message"><textarea value={body} onChange={event => setBody(event.target.value)} required rows={15} className="w-full rounded-xl border border-ink-200 px-4 py-3 font-mono text-sm" /></Label><div><p className="text-xs font-medium text-ink-500">Insert a detail</p><div className="mt-2 flex flex-wrap gap-2">{tokens.map(token => <button type="button" key={token} onClick={() => setBody(current => `${current}{{${token}}}`)} className="rounded-lg border border-ink-200 px-2 py-1 font-mono text-xs text-ink-600">{`{{${token}}}`}</button>)}</div></div><button disabled={busy} className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-night-950">Save template</button></form><section className="mt-4 rounded-2xl border border-ink-200 bg-surface p-5"><p className="text-xs font-semibold uppercase tracking-[.12em] text-ink-400">Preview · sample shipment</p><h3 className="mt-3 font-semibold text-ink-900">{subject.replaceAll('{{trackingNumber}}','SSC-38111554')}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">{body.replaceAll('{{recipientName}}','Joy').replaceAll('{{trackingNumber}}','SSC-38111554').replaceAll('{{status}}','Booked').replaceAll('{{service}}','Standard').replaceAll('{{origin}}','Lagos, Nigeria').replaceAll('{{destination}}','London, United Kingdom').replaceAll('{{currentLocation}}','Lagos facility').replaceAll('{{carrier}}','SwiftStream Cargo').replaceAll('{{pieces}}','1').replaceAll('{{weight}}','1,200 lb').replaceAll('{{estimatedDelivery}}','October 24').replaceAll('{{trackingUrl}}','https://example.com/track').replaceAll('{{companyName}}','Your logistics company')}</p></section></div></div></>;
}

function NotifyCustomer({ shipment, site, templates, history, configured, configError, action, busy }: { shipment: Shipment; site: CargoTemplateSettings; templates: EmailTemplate[]; history: EmailSend[]; configured: boolean; configError: string | null; action: (payload: Record<string, string>) => Promise<boolean>; busy: boolean }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id || 'booked'); const [to, setTo] = useState(shipment.customerEmail || ''); const [recipientName, setRecipientName] = useState(shipment.customer || ''); const [preview, setPreview] = useState<{ subject: string; text: string } | null>(null); const [previewing, setPreviewing] = useState(false); const [error, setError] = useState('');
  const selected = templates.find(item => item.id === templateId);
  const previewEmail = useCallback(async () => { setPreviewing(true); setError(''); try { const response = await fetch('/api/eazytools/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'notification-preview', shipmentId: shipment.id, templateId, recipientName }) }); const result = await response.json(); if (!response.ok || !result.preview) throw new Error(result.error || 'Preview could not be created.'); setPreview(result.preview); } catch (issue) { setError(issue instanceof Error ? issue.message : 'Preview could not be created.'); } finally { setPreviewing(false); } }, [shipment.id, templateId, recipientName]);
  useEffect(() => { void previewEmail(); }, [previewEmail]);
  return <section className="mt-8 rounded-2xl border border-ink-200 bg-surface p-5 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900"><Mail className="h-5 w-5 text-brand-700" />Notify the customer</h2><p className="mt-1 text-sm text-ink-500">Preview the exact branded email before sending it.</p>{!configured && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Sending is unavailable — {configError || 'the email provider is not configured.'} Preview still works.</p>}<div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="space-y-4"><Label text="Template"><select value={templateId} onChange={event => setTemplateId(event.target.value)} className="w-full rounded-xl border border-ink-200 bg-surface px-4 py-3">{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></Label>{selected && <p className="-mt-2 text-xs text-ink-500">{selected.description}</p>}<Label text="Recipient name"><input value={recipientName} onChange={event => setRecipientName(event.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-3" /></Label><Label text="Send to"><input type="email" value={to} onChange={event => setTo(event.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-3" placeholder="customer@example.com" /></Label>{error && <p className="text-sm text-rose-600">{error}</p>}<button disabled={!configured || busy || !to} onClick={() => action({ action: 'notification-send', shipmentId: shipment.id, templateId, recipientName, to })} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-semibold text-night-950 disabled:opacity-40"><Send className="h-4 w-4" />Send notification</button></div><div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-50"><div className="flex items-center gap-3 bg-night-950 p-5 text-white">{site.logoDataUrl ? <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white p-1"><Image unoptimized src={site.logoDataUrl} width={40} height={40} alt={`${site.name} logo`} className="h-full w-full object-contain" /></span> : <LogoMark tone="light" />}<div><p className="font-semibold">{site.name}</p><p className="text-xs text-white/60">Shipment notification</p></div></div><div className="p-5"><p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.08em] text-ink-500"><Eye className="h-3.5 w-3.5" />Preview</p>{previewing && !preview ? <p className="mt-4 text-sm text-ink-400">Rendering…</p> : preview ? <><h3 className="mt-4 font-semibold text-ink-900">{preview.subject}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-700">{preview.text}</p></> : <p className="mt-4 text-sm text-ink-400">Choose a template to preview the email.</p>}</div></div></div>{history.length > 0 && <div className="mt-6 border-t border-ink-200 pt-4"><h3 className="text-sm font-semibold text-ink-700">Already sent</h3><ul className="mt-2 space-y-2">{history.map(entry => <li key={entry.id} className="flex flex-wrap items-center gap-2 text-sm"><span className={`rounded px-1.5 py-0.5 text-[.68rem] font-semibold uppercase ${entry.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{entry.status}</span><span className="font-medium text-ink-800">{entry.templateName}</span><span className="text-ink-500">to {entry.to}</span><time className="ml-auto text-xs text-ink-400">{new Date(entry.createdAt).toLocaleString()}</time>{entry.error && <span className="w-full text-xs text-rose-600">{entry.error}</span>}</li>)}</ul></div>}</section>;
}

function WebsiteSettings({ site }: { site: CargoTemplateSettings }) { return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Website settings</h1><p className="mt-1.5 text-[.95rem] text-ink-500">Manage your brand, contact details, colors, logo, and chat buttons.</p><div className="mt-8 rounded-2xl border border-ink-200 bg-surface p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-xl font-semibold text-ink-900">{site.name}</p><p className="mt-1 text-sm text-ink-500">{site.email} · {site.phone}</p><p className="mt-1 text-sm text-ink-500">{site.address}</p></div><a href="/template-editor" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 font-semibold text-night-950"><Palette className="h-4 w-4" />Open website editor</a></div></div></>; }

function AuditLog({ entries }: { entries: Audit[] }) { return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Audit log</h1><p className="mt-1.5 text-[.95rem] text-ink-500">A read-only history of important changes in your workspace.</p>{entries.length ? <ul className="mt-8 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-surface">{entries.map(entry => <li key={entry.id} className="grid gap-2 p-5 sm:grid-cols-[11rem_1fr]"><time className="text-xs text-ink-400">{new Date(entry.createdAt).toLocaleString()}</time><div><p className="font-medium text-ink-900">{entry.action}</p><p className="text-sm text-ink-500">{entry.targetId || 'Workspace'}{entry.status ? ` · ${entry.status}` : ''}</p></div></li>)}</ul> : <div className="mt-8"><Empty icon={FileClock} text="No audit entries yet." /></div>}</>; }

function CollectionView({ title, description, empty, items }: { title: string; description: string; empty: string; items: Array<{ id: string; title: string; detail: string; meta: string }> }) { return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h1><p className="mt-1.5 text-[.95rem] text-ink-500">{description}</p>{items.length ? <ul className="mt-8 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-surface">{items.map(item => <li key={item.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-ink-900">{item.title}</p><p className="mt-1 text-sm text-ink-500">{item.detail}</p></div><span className="w-fit rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700">{item.meta}</span></li>)}</ul> : <div className="mt-8"><Empty icon={title === 'Live chat' ? MessageCircle : Inbox} text={empty} /></div>}</>; }
function Empty({ icon: Icon, text }: { icon: typeof Truck; text: string }) { return <div className="rounded-2xl border border-dashed border-ink-200 bg-surface p-10 text-center text-sm text-ink-500"><Icon className="mx-auto mb-3 h-6 w-6 text-ink-400" />{text}</div>; }
function Label({ text, children }: { text: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-semibold text-ink-700">{text}{children}</label>; }
