import type { Metadata } from 'next';
import { Clock4, Headphones, Mail, MapPin, MessageSquare, Phone, Truck } from 'lucide-react';
import { ContactForm } from '@/components/ContactForm';
import { PageHero } from '@/components/PageHero';
import { Reveal, RevealItem, StaggerGroup } from '@/components/ui/Reveal';
import { WhatsAppIcon } from '@/components/icons/WhatsApp';
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from '@/lib/site';
import { getWebsiteConfig } from '@/lib/operations';

export const metadata: Metadata = {
  title: 'Contact Swiftstream Cargo',
  description:
    'Talk to the Swiftstream Cargo team about a quote, an existing shipment, warehousing, enterprise logistics, or partnerships.',
  alternates: { canonical: '/contact' },
};

const BASE_CHANNELS = [
  {
    icon: WhatsAppIcon,
    title: 'WhatsApp us',
    body: 'Message customer service for a quick answer on an active shipment.',
    action: WHATSAPP_DISPLAY,
    href: WHATSAPP_URL,
    external: true,
  },
  {
    icon: MessageSquare,
    title: 'Request a quote',
    body: 'Share a lane and get options back the same day.',
    action: 'Open the quote form',
    href: '/quote',
  },
  {
    icon: Truck,
    title: 'Track a shipment',
    body: 'Live status, timeline, and delivery estimate.',
    action: 'Open tracking',
    href: '/tracking',
  },
];

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const config = await getWebsiteConfig();
  const channels = [
    { icon: Phone, title: 'Call us', body: 'Speak with the team during the published business hours.', action: config.phone, href: `tel:${config.phone.replace(/[^+\d]/g, '')}` },
    { icon: Mail, title: 'Email us', body: 'Quotes, documents, and account questions.', action: config.email, href: `mailto:${config.email}` },
    ...BASE_CHANNELS,
  ];
  return (
    <>
      <PageHero
        eyebrow="Contact"
        breadcrumb="Contact"
        title={
          <>
            Talk to a team that <span className="text-gradient">answers.</span>
          </>
        }
        description="Sales, dispatch, and support are staffed by people who know freight. Pick the fastest route to the answer you need."
      />

      <section className="section bg-surface">
        <div className="container">
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.07}>
            {channels.map((channel) => (
              <RevealItem key={channel.title}>
                <a
                  href={channel.href}
                  target={channel.external ? '_blank' : undefined}
                  rel={channel.external ? 'noopener noreferrer' : undefined}
                  className="group flex h-full flex-col rounded-3xl border border-ink-100 bg-surface p-6 shadow-soft transition-all duration-400 ease-premium hover:-translate-y-1 hover:border-brand-200 dark:hover:border-brand-500/30 hover:shadow-card"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300 transition-colors duration-400 group-hover:bg-brand-600 group-hover:text-white">
                    <channel.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 font-display text-lg font-semibold text-ink-900">{channel.title}</h2>
                  <p className="mt-1.5 flex-1 text-[0.92rem] leading-relaxed text-ink-500">{channel.body}</p>
                  <span className="mt-4 text-[0.92rem] font-semibold text-brand-700 dark:text-brand-300 underline decoration-brand-500/40 decoration-2 underline-offset-4 transition-colors group-hover:decoration-brand-600">
                    {channel.action}
                  </span>
                </a>
              </RevealItem>
            ))}
          </StaggerGroup>

          <div className="mt-14 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
            <Reveal>
              <ContactForm />
            </Reveal>

            <div className="flex flex-col gap-5">
              <Reveal delay={0.1}>
                <div className="rounded-3xl border border-ink-100 bg-ink-50/60 p-6 sm:p-8">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
                    <Clock4 className="h-[1.1rem] w-[1.1rem] text-brand-600 dark:text-brand-300" aria-hidden="true" />
                    Hours
                  </h2>
                  <dl className="mt-4 space-y-2.5 text-[0.95rem]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">Sales & quoting</dt>
                      <dd className="font-medium text-ink-800">{config.hours}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">Dispatch & tracking</dt>
                      <dd className="font-medium text-ink-800">See latest shipment event</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">Accounts</dt>
                      <dd className="font-medium text-ink-800">{config.hours}</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>

              <Reveal delay={0.16}>
                <div className="rounded-3xl border border-ink-100 bg-surface p-6 shadow-soft sm:p-8">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
                    <MapPin className="h-[1.1rem] w-[1.1rem] text-brand-600 dark:text-brand-300" aria-hidden="true" />
                    Offices
                  </h2>
                  <ul className="mt-4 divide-y divide-ink-100">
                    <li className="py-3.5 first:pt-0 last:pb-0"><p className="text-[0.95rem] font-semibold text-ink-900">Office address</p><p className="mt-1 text-sm text-ink-500">{config.address}</p></li>
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={0.22}>
                <div className="rounded-3xl bg-night-950 p-6 text-white sm:p-8">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-brand-300">
                    <Headphones className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 font-display text-lg font-semibold text-white">Shipment emergency?</h2>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-300">
                    For freight already in motion, call dispatch directly — it is the fastest way to reach the Swiftstream Cargo operations team handling it.
                  </p>
                  <a
                    href={`tel:${config.phone.replace(/[^+\d]/g, '')}`}
                    className="mt-4 inline-flex items-center gap-2 font-display text-lg font-semibold text-white transition-colors hover:text-brand-300"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {config.phone}
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
