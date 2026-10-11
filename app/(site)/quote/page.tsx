import type { Metadata } from 'next';
import { Clock4, FileCheck2, HandCoins, Headphones } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { QuoteLeadForm } from '@/components/QuoteLeadForm';
import { Reveal } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Get a Freight Quote',
  description:
    'Request a freight quote from Swiftstream Cargo. Share your lane and shipment type — a logistics specialist responds with options and pricing.',
  alternates: { canonical: '/quote' },
};

const ASSURANCES = [
  { icon: Clock4, title: 'Clear confirmation', body: 'A reference appears only after the server stores your request.' },
  { icon: HandCoins, title: 'No account required', body: 'Request pricing without creating a customer login.' },
  { icon: FileCheck2, title: 'Useful shipment detail', body: 'Share the route and shipment type so operations can review it.' },
  { icon: Headphones, title: 'Human follow-up', body: 'Your contact details are available only to the operations team.' },
];

export default function QuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Freight quote"
        breadcrumb="Quote"
        title={
          <>
            Let&rsquo;s move <span className="text-gradient">your freight.</span>
          </>
        }
        description="Tell us the lane and roughly what you're shipping. A specialist comes back with the right mode, realistic transit times, and a price you can plan around."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ASSURANCES.map((item) => (
            <li key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <item.icon className="h-5 w-5 text-brand-300" aria-hidden="true" />
              <p className="mt-3 text-[0.95rem] font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm text-ink-300">{item.body}</p>
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="section bg-ink-50/60">
        <div className="container">
          <Reveal>
            <QuoteLeadForm />
          </Reveal>

        </div>
      </section>
    </>
  );
}
