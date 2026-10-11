import type { Metadata } from 'next';
import { CircleDashed, Clock4, FileCheck2, Headphones, Hourglass, PackageSearch, ShieldCheck, Truck } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { TrackingWidget } from '@/components/TrackingWidget';
import { Button } from '@/components/ui/Button';
import { StaggerGroup, RevealItem } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const metadata: Metadata = {
  title: 'Track a Shipment',
  description:
    'Track your Swiftstream Cargo shipment in real time. Enter your tracking number for live status, current location, timeline, and estimated delivery.',
  alternates: { canonical: '/tracking' },
};

const STATUS_GUIDE = [
  {
    icon: Hourglass,
    title: 'Shipment Created',
    body: 'The shipment record has been created and its pickup details are being prepared.',
  },
  {
    icon: Truck,
    title: 'Picked Up',
    body: 'Freight has been collected and scanned into the network. Piece counts are verified at this scan.',
  },
  {
    icon: CircleDashed,
    title: 'In Transit',
    body: 'Your shipment is moving between facilities. Each transfer adds a new scan to the timeline.',
  },
  {
    icon: FileCheck2,
    title: 'Arrived at Facility',
    body: 'The shipment has reached a sorting or transfer facility and is waiting for its next movement.',
  },
  {
    icon: Clock4,
    title: 'Out for Delivery',
    body: 'A final-mile driver has your freight and a delivery window has been sent to the recipient.',
  },
  {
    icon: ShieldCheck,
    title: 'Delivered',
    body: 'Proof of delivery — signature or photo — is captured and attached to the shipment record.',
  },
  {
    icon: Hourglass,
    title: 'On Hold',
    body: 'Movement is temporarily paused. The most recent database event explains the recorded reason.',
  },
];

interface TrackingPageProps {
  searchParams: Promise<{ number?: string }>;
}

export default async function TrackingPage({ searchParams }: TrackingPageProps) {
  const params = await searchParams;
  const initialQuery = typeof params.number === 'string' ? params.number.slice(0, 32) : '';
  return (
    <>
      <PageHero
        eyebrow="Shipment tracking"
        breadcrumb="Tracking"
        overlap
        title={
          <>
            Know exactly where <span className="text-gradient">your freight is.</span>
          </>
        }
        description="Every Swiftstream Cargo pickup, transfer, and delivery scan lands in one clear timeline."
      />

      <section className="relative z-10 -mt-24 sm:-mt-28">
        <div className="container">
          <TrackingWidget variant="floating" initialQuery={initialQuery} />
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <SectionHeading
            eyebrow="Status guide"
            title="What each shipment status means"
            description="Swiftstream Cargo uses the same clear milestones on every service, from a single parcel to a full container."
          />

          <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.07}>
            {STATUS_GUIDE.map((status, index) => (
              <RevealItem
                key={status.title}
                className="rounded-3xl border border-ink-100 bg-surface p-6 shadow-soft transition-[border-color,box-shadow,transform] duration-400 ease-premium hover:-translate-y-1 hover:border-brand-200 dark:hover:border-brand-500/30 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300">
                    <status.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">{status.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">{status.body}</p>
              </RevealItem>
            ))}

            <RevealItem className="flex flex-col justify-between rounded-3xl border border-night-900 bg-night-950 p-6 text-white">
              <div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-brand-300">
                  <Headphones className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">Something look wrong?</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-300">
                  If a scan is missing or a delivery window has moved, our operations team can review the shipment record and help.
                </p>
              </div>
              <div className="on-dark mt-6">
                <Button href="/contact" variant="onDark" size="md">
                  Contact support
                </Button>
              </div>
            </RevealItem>
          </StaggerGroup>
        </div>
      </section>
    </>
  );
}
