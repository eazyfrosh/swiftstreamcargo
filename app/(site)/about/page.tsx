import type { Metadata } from 'next';
import { Compass, HeartHandshake, Radar, Users } from 'lucide-react';
import { CTA } from '@/components/CTA';
import { PageHero } from '@/components/PageHero';
import { Figure } from '@/components/ui/Figure';
import { RevealItem, StaggerGroup } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { IMAGERY } from '@/lib/site';

export const metadata: Metadata = { title: 'About Swiftstream Cargo', description: 'Learn how Swiftstream Cargo approaches freight visibility, accountability, and customer support.', alternates: { canonical: '/about' } };
const VALUES = [
  { icon: Radar, title: 'Transparency by default', body: 'Public tracking shows recorded shipment events and nothing fabricated.' },
  { icon: Compass, title: 'Own the journey', body: 'A clear operating record connects pickup, facilities, linehaul, and delivery.' },
  { icon: HeartHandshake, title: 'Human support', body: 'Customers can reach a person when a shipment needs context or action.' },
  { icon: Users, title: 'Useful operations', body: 'The admin workflow is designed around creating, updating, and resolving real shipments.' },
];

export default function AboutPage() { return <><PageHero eyebrow="Company" breadcrumb="About" title={<>A clearer way to coordinate <span className="text-gradient">every handoff.</span></>} description="Swiftstream Cargo combines practical freight operations with a transparent shipment record for customers and staff." /><section className="section bg-surface"><div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-16"><div><SectionHeading eyebrow="Our approach" title="Visibility without invented promises" description="We do not publish unverified statistics, partner claims, certifications, or customer endorsements. The website explains the service, records genuine enquiries, and displays only shipment events stored by the operations team." /></div><div className="overflow-hidden rounded-4xl border border-ink-100 shadow-card"><Figure media={IMAGERY.port} className="h-72 w-full object-cover sm:h-96" /></div></div></section><section className="section bg-ink-50/60"><div className="container"><SectionHeading eyebrow="How we work" align="center" title="Principles built into the platform" /><StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2" gap={0.08}>{VALUES.map((value) => <RevealItem key={value.title} className="rounded-3xl border border-ink-100 bg-surface p-7 shadow-soft"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-night-900 text-white"><value.icon className="h-5 w-5" /></span><h3 className="mt-6 font-display text-xl font-semibold text-ink-900">{value.title}</h3><p className="mt-2 text-ink-500">{value.body}</p></RevealItem>)}</StaggerGroup></div></section><CTA /></>; }
