'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, ExternalLink, FileClock,
  Inbox, LayoutDashboard, Loader2, Mail, Menu, MessageCircle, PackagePlus, Palette,
  Settings, Truck, X,
} from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import type { CargoTemplateSettings } from '@/lib/eazytools-workspace';

type Shipment = { id: string; trackingNumber: string; customer: string; customerEmail?: string; origin: string; destination: string; service?: string; status: string; createdAt: string };
type Audit = { id: string; action: string; targetId?: string; status?: string; createdAt: string };
type Enquiry = { id: string; name?: string; email?: string; message?: string; status?: string; createdAt: string };
type Chat = { id: string; customer?: string; email?: string; lastMessage?: string; status?: string; updatedAt?: string };
type EmailTemplate = { subject: string; body: string; updatedAt?: string };
type Data = { site: CargoTemplateSettings; shipments: Shipment[]; audit: Audit[]; enquiries: Enquiry[]; chats: Chat[]; emailTemplate: EmailTemplate };
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
        {active === 'templates' && <EmailTemplates initial={data.emailTemplate} action={action} busy={busy} />}
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
  return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Shipments</h1><p className="mt-1.5 text-[.95rem] text-ink-500">Every booking in your private network, newest first.</p><div className="mt-6 overflow-hidden rounded-2xl border border-ink-200 bg-surface">{data.shipments.length ? <div className="divide-y divide-ink-100">{data.shipments.map(item => <article key={item.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-mono text-sm font-semibold text-ink-900">{item.trackingNumber}</p><p className="mt-1 text-sm font-medium text-ink-700">{item.customer}</p><p className="mt-1 text-sm text-ink-500">{item.origin} → {item.destination}{item.service ? ` · ${item.service}` : ''}</p></div><select disabled={busy} value={item.status} onChange={event => action({ action: 'shipment-status', id: item.id, status: event.target.value })} className="rounded-xl border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-800">{statusOptions.map(status => <option key={status}>{status}</option>)}</select></article>)}</div> : <Empty icon={Truck} text="No shipments yet. Book one and it will appear here." />}</div></>;
}

function ShipmentList({ shipments }: { shipments: Shipment[] }) { return <ul className="mt-3 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-surface">{shipments.length ? shipments.map(item => <li key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><span><span className="font-mono text-sm font-semibold text-ink-900">{item.trackingNumber}</span><span className="mt-0.5 block text-sm text-ink-500">{item.origin} → {item.destination}</span></span><span className="w-fit rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700">{item.status}</span></li>) : <li><Empty icon={Truck} text="No shipments yet." /></li>}</ul>; }

function BookShipment({ action, busy, onCreated }: { action: (payload: Record<string, string>) => Promise<boolean>; busy: boolean; onCreated: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const ok = await action({ action: 'shipment-create', customer: String(form.get('customer') || ''), customerEmail: String(form.get('customerEmail') || ''), origin: String(form.get('origin') || ''), destination: String(form.get('destination') || ''), service: String(form.get('service') || '') }); if (ok) { event.currentTarget.reset(); onCreated(); } }
  const field = 'w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-ink-900 outline-none focus:border-brand-500';
  return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Book a shipment</h1><p className="mt-1.5 max-w-2xl text-[.95rem] text-ink-500">Create a booking for your customer. The generated reference can be used for tracking.</p><form onSubmit={submit} className="mt-8 grid gap-5 rounded-2xl border border-ink-200 bg-surface p-5 sm:p-7 lg:grid-cols-2"><Label text="Customer name"><input name="customer" required className={field} placeholder="Alex Morgan" /></Label><Label text="Customer email"><input name="customerEmail" type="email" className={field} placeholder="alex@example.com" /></Label><Label text="Origin"><input name="origin" required className={field} placeholder="Lagos, Nigeria" /></Label><Label text="Destination"><input name="destination" required className={field} placeholder="London, United Kingdom" /></Label><Label text="Service"><select name="service" className={field}><option>Road transport</option><option>Air freight</option><option>Sea freight</option><option>Warehousing</option><option>Final-mile delivery</option></select></Label><div className="flex items-end"><button disabled={busy} className="h-[50px] w-full rounded-xl bg-brand-500 px-5 font-semibold text-night-950 disabled:opacity-60">{busy ? 'Creating…' : 'Create shipment'}</button></div></form></>;
}

function EmailTemplates({ initial, action, busy }: { initial: EmailTemplate; action: (payload: Record<string, string>) => Promise<boolean>; busy: boolean }) {
  const [subject, setSubject] = useState(initial.subject); const [body, setBody] = useState(initial.body);
  return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Email templates</h1><p className="mt-1.5 text-[.95rem] text-ink-500">Edit the shipment update wording for your own customers.</p><div className="mt-8 grid gap-6 lg:grid-cols-2"><form onSubmit={event => { event.preventDefault(); void action({ action: 'template-save', subject, body }); }} className="space-y-5 rounded-2xl border border-ink-200 bg-surface p-5 sm:p-7"><Label text="Subject"><input value={subject} onChange={event => setSubject(event.target.value)} required className="w-full rounded-xl border border-ink-200 px-4 py-3" /></Label><Label text="Message"><textarea value={body} onChange={event => setBody(event.target.value)} required rows={10} className="w-full rounded-xl border border-ink-200 px-4 py-3" /></Label><button disabled={busy} className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-night-950">Save template</button></form><section className="rounded-2xl border border-ink-200 bg-surface p-6"><p className="text-xs font-semibold uppercase tracking-[.12em] text-ink-400">Preview</p><h2 className="mt-4 text-xl font-semibold text-ink-900">{subject || 'Email subject'}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-600">{body || 'Your email message will appear here.'}</p></section></div></>;
}

function WebsiteSettings({ site }: { site: CargoTemplateSettings }) { return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Website settings</h1><p className="mt-1.5 text-[.95rem] text-ink-500">Manage your brand, contact details, colors, logo, and chat buttons.</p><div className="mt-8 rounded-2xl border border-ink-200 bg-surface p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-xl font-semibold text-ink-900">{site.name}</p><p className="mt-1 text-sm text-ink-500">{site.email} · {site.phone}</p><p className="mt-1 text-sm text-ink-500">{site.address}</p></div><a href="/template-editor" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 font-semibold text-night-950"><Palette className="h-4 w-4" />Open website editor</a></div></div></>; }

function AuditLog({ entries }: { entries: Audit[] }) { return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Audit log</h1><p className="mt-1.5 text-[.95rem] text-ink-500">A read-only history of important changes in your workspace.</p>{entries.length ? <ul className="mt-8 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-surface">{entries.map(entry => <li key={entry.id} className="grid gap-2 p-5 sm:grid-cols-[11rem_1fr]"><time className="text-xs text-ink-400">{new Date(entry.createdAt).toLocaleString()}</time><div><p className="font-medium text-ink-900">{entry.action}</p><p className="text-sm text-ink-500">{entry.targetId || 'Workspace'}{entry.status ? ` · ${entry.status}` : ''}</p></div></li>)}</ul> : <div className="mt-8"><Empty icon={FileClock} text="No audit entries yet." /></div>}</>; }

function CollectionView({ title, description, empty, items }: { title: string; description: string; empty: string; items: Array<{ id: string; title: string; detail: string; meta: string }> }) { return <><h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h1><p className="mt-1.5 text-[.95rem] text-ink-500">{description}</p>{items.length ? <ul className="mt-8 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-surface">{items.map(item => <li key={item.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-ink-900">{item.title}</p><p className="mt-1 text-sm text-ink-500">{item.detail}</p></div><span className="w-fit rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700">{item.meta}</span></li>)}</ul> : <div className="mt-8"><Empty icon={title === 'Live chat' ? MessageCircle : Inbox} text={empty} /></div>}</>; }
function Empty({ icon: Icon, text }: { icon: typeof Truck; text: string }) { return <div className="rounded-2xl border border-dashed border-ink-200 bg-surface p-10 text-center text-sm text-ink-500"><Icon className="mx-auto mb-3 h-6 w-6 text-ink-400" />{text}</div>; }
function Label({ text, children }: { text: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-semibold text-ink-700">{text}{children}</label>; }
