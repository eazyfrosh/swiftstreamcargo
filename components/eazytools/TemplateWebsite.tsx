'use client';

import { useEffect, useState } from 'react';
import { Accordion } from '@/components/Accordion';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Navbar } from '@/components/Navbar';
import { NetworkStory } from '@/components/NetworkStory';
import { Services } from '@/components/Services';
import { TrackingWidget } from '@/components/TrackingWidget';
import { WhySwiftstream } from '@/components/WhySwiftstream';
import type { CargoTemplateSettings } from '@/lib/eazytools-workspace';

const FAQ = [
  { question: 'Where do tracking updates come from?', answer: 'The public timeline shows the shipment milestones recorded by the logistics team.' },
  { question: 'Can I request a quote without an account?', answer: 'Yes. Share the route, shipment type, and contact details to begin.' },
  { question: 'What happens when a tracking number is not found?', answer: 'Check the reference and try again, or contact the support team for help.' },
  { question: 'Which services can be combined?', answer: 'Road, forwarding, warehousing, and final-mile services can be coordinated as one movement.' },
];

export function TemplateWebsite({ initial }: { initial: CargoTemplateSettings }) {
  const [site, setSite] = useState(initial);
  useEffect(() => { const receive = (event: MessageEvent) => { if (event.origin === window.location.origin && event.data?.type === 'swiftstream-template-preview') setSite(current => ({ ...current, ...event.data.settings })); }; window.addEventListener('message', receive); return () => window.removeEventListener('message', receive); }, []);
  const style = { '--cargo-primary': site.primaryColor, '--cargo-dark': site.darkColor } as React.CSSProperties;
  const config = { name: site.name, tagline: site.tagline, email: site.email, phone: site.phone, address: site.address, hours: 'Monday–Friday, 8:00–17:00' };
  return <div style={style} className="swiftstream-template min-h-screen bg-surface text-ink-700">
    <style>{`.swiftstream-template .bg-brand-500,.swiftstream-template .bg-brand-600{background-color:var(--cargo-primary)!important}.swiftstream-template .text-brand-300,.swiftstream-template .text-brand-400,.swiftstream-template .text-brand-500,.swiftstream-template .text-brand-600,.swiftstream-template .text-brand-700{color:var(--cargo-primary)!important}.swiftstream-template .border-brand-400,.swiftstream-template .border-brand-500{border-color:var(--cargo-primary)!important}.swiftstream-template .bg-night-950,.swiftstream-template .bg-night-900,.swiftstream-template .bg-navy-900{background-color:var(--cargo-dark)!important}`}</style>
    <Navbar config={config} logoDataUrl={site.logoDataUrl} homeHref={`/site/${site.siteId}`} />
    <main id="main"><Hero tagline={site.tagline} />
      <section id="tracking" className="relative z-10 -mt-20 bg-transparent"><div className="container"><TrackingWidget variant="floating" /></div></section>
      <NetworkStory /><Services /><WhySwiftstream /><HowItWorks />
      <section className="section bg-surface"><div className="container grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20"><div><span className="eyebrow">Frequently asked</span><h2 className="display-2 mt-5">Straight answers before you ship.</h2></div><Accordion items={FAQ} /></div></section>
      <CTA />
    </main>
    <Footer config={config} logoDataUrl={site.logoDataUrl} copyrightText={site.copyrightText} />
    {site.whatsappEnabled && site.whatsappNumber && <a aria-label="Open WhatsApp" target="_blank" href={`https://wa.me/${site.whatsappNumber.replace(/\D/g,'')}`} className="fixed bottom-5 right-5 grid size-14 place-items-center rounded-full bg-emerald-500 font-bold text-white shadow-xl">WA</a>}{site.telegramEnabled && site.telegramUrl && <a aria-label="Open Telegram" target="_blank" href={site.telegramUrl} className="fixed bottom-5 right-24 grid size-14 place-items-center rounded-full bg-sky-500 font-bold text-white shadow-xl">TG</a>}
  </div>;
}
