'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import type { CargoTemplateSettings } from '@/lib/eazytools-workspace';

export function TemplateEditor() {
  const [settings, setSettings] = useState<CargoTemplateSettings | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLIFrameElement>(null);

  useEffect(() => { fetch('/api/eazytools/settings', { cache: 'no-store' }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setSettings(data.settings); }).catch(error => setMessage(error instanceof Error ? error.message : 'Editor could not be opened.')); }, []);
  useEffect(() => { if (settings) preview.current?.contentWindow?.postMessage({ type: 'swiftstream-template-preview', settings }, window.location.origin); }, [settings]);
  const set = <K extends keyof CargoTemplateSettings>(key: K, value: CargoTemplateSettings[K]) => setSettings(current => current ? { ...current, [key]: value } : current);
  function logo(file?: File) { if (!file) return; if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 250_000) return setMessage('Use a PNG, JPG, or WebP logo no larger than 250 KB.'); const reader = new FileReader(); reader.onload = () => set('logoDataUrl', String(reader.result)); reader.readAsDataURL(file); }
  async function save(event: FormEvent) { event.preventDefault(); if (!settings) return; setBusy(true); setMessage('Saving…'); try { const response = await fetch('/api/eazytools/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSettings(data.settings); setMessage('Saved and published to your SwiftStream Cargo website.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed.'); } finally { setBusy(false); } }
  if (!settings) return <main className="grid min-h-screen place-items-center bg-night-950 px-5 text-center text-white">{message || <Loader2 className="animate-spin" />}</main>;
  const field = 'w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-orange-400';
  return <main className="min-h-screen bg-night-950 px-4 py-7 text-white sm:px-6"><div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
    <form onSubmit={save} className="space-y-5 rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">SwiftStream Cargo editor</p><h1 className="mt-2 text-3xl font-bold text-white">Customize your website</h1><p className="mt-2 text-sm leading-6 text-white/60">These details belong only to your EazyTool workspace.</p></div>
      <Field label="Website name"><input className={field} value={settings.name} onChange={e => set('name', e.target.value)} /></Field>
      <Field label="Tagline"><textarea className={`${field} min-h-24`} value={settings.tagline} onChange={e => set('tagline', e.target.value)} /></Field>
      <Field label="Logo"><input className={field} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => logo(e.target.files?.[0])} /><span className="text-xs font-normal text-white/45">PNG, JPG or WebP up to 250 KB.</span></Field>
      {settings.logoDataUrl && <button type="button" onClick={() => set('logoDataUrl', '')} className="text-sm font-semibold text-rose-300">Remove uploaded logo</button>}
      <div className="grid grid-cols-2 gap-3"><Color label="Primary" value={settings.primaryColor} onChange={value => set('primaryColor', value)} /><Color label="Dark background" value={settings.darkColor} onChange={value => set('darkColor', value)} /></div>
      <Field label="Support email"><input className={field} type="email" value={settings.email} onChange={e => set('email', e.target.value)} /></Field>
      <Field label="Phone number"><input className={field} value={settings.phone} onChange={e => set('phone', e.target.value)} /></Field>
      <Field label="Business address"><textarea className={`${field} min-h-20`} value={settings.address} onChange={e => set('address', e.target.value)} /></Field>
      <Field label="Copyright"><input className={field} value={settings.copyrightText} onChange={e => set('copyrightText', e.target.value)} /></Field>
      <Toggle label="WhatsApp floating button" checked={settings.whatsappEnabled} onChange={value => set('whatsappEnabled', value)}><input className={field} value={settings.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} placeholder="+2348012345678" /></Toggle>
      <Toggle label="Telegram floating button" checked={settings.telegramEnabled} onChange={value => set('telegramEnabled', value)}><input className={field} value={settings.telegramUrl} onChange={e => set('telegramUrl', e.target.value)} placeholder="https://t.me/yourbusiness" /></Toggle>
      <button disabled={busy} className="w-full rounded-full bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save and publish'}</button>
      {message && <p role="status" className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">{message}</p>}
    </form>
    <section className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[.04]"><div className="flex flex-wrap items-center justify-between gap-3 p-4"><div><b>Live preview</b><p className="text-xs text-white/50">Changes update while you type.</p></div><a href={`/site/${settings.siteId}`} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm">Open website <ExternalLink size={15} /></a></div><iframe ref={preview} onLoad={() => preview.current?.contentWindow?.postMessage({ type: 'swiftstream-template-preview', settings }, window.location.origin)} src={`/site/${settings.siteId}`} title="SwiftStream Cargo preview" className="h-[760px] w-full bg-white sm:h-[900px]" /></section>
  </div></main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-semibold">{label}{children}</label>; }
function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-2 rounded-xl border border-white/10 p-3 text-sm font-semibold">{label}<span className="flex items-center gap-2"><input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-10 w-14" /><code className="text-xs">{value}</code></span></label>; }
function Toggle({ label, checked, onChange, children }: { label: string; checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) { return <fieldset className="grid gap-3 rounded-2xl border border-white/10 p-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />{label}</label>{children}</fieldset>; }
