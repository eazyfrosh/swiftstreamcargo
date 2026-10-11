import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { CTA } from '@/components/CTA';
import { Button } from '@/components/ui/Button';
import { SERVICES } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return SERVICES.map((service) => ({ slug: service.slug })); }
export async function generateMetadata({ params }: Params): Promise<Metadata> { const { slug } = await params; const service = SERVICES.find((item) => item.slug === slug); return service ? { title: service.title, description: service.description, alternates: { canonical: `/services/${slug}` } } : {}; }

export default async function ServiceDetailPage({ params }: Params) {
  const { slug } = await params; const service = SERVICES.find((item) => item.slug === slug); if (!service) notFound();
  return <><PageHero eyebrow="Logistics service" breadcrumb={service.title} title={<>{service.title}<span className="text-gradient">, coordinated end to end.</span></>} description={service.description}><div className="flex flex-col gap-3 sm:flex-row"><Button href={`/quote?service=${service.slug}`} size="lg" variant="onDark">Request a quote <ArrowRight className="h-4 w-4" /></Button><Button href="/contact" size="lg" variant="outlineDark">Talk to a specialist</Button></div></PageHero><section className="section bg-surface"><div className="container grid gap-12 lg:grid-cols-[1fr_.8fr]"><div><span className="eyebrow">What is included</span><h2 className="display-2 mt-5">A practical service built around your shipment.</h2><p className="lead mt-5">We confirm the route, timing, handling needs, and documentation before dispatch. Every milestone shown to customers comes from a recorded database event—never a simulated carrier feed.</p></div><div className="rounded-3xl border border-ink-100 bg-ink-50/60 p-7"><service.icon className="h-10 w-10 text-brand-600" /><h3 className="mt-5 font-display text-xl font-semibold text-ink-900">Service capabilities</h3><ul className="mt-5 space-y-3">{service.highlights.map((item) => <li key={item} className="flex gap-3 text-ink-600"><Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />{item}</li>)}</ul></div></div></section><CTA /></>;
}
