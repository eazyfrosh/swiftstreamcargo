import { Accordion } from '@/components/Accordion';
import { CTA } from '@/components/CTA';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { NetworkStory } from '@/components/NetworkStory';
import { QuoteLeadForm } from '@/components/QuoteLeadForm';
import { Services } from '@/components/Services';
import { TrackingWidget } from '@/components/TrackingWidget';
import { WhySwiftstream } from '@/components/WhySwiftstream';

const FAQ = [
  { question: 'Where do tracking updates come from?', answer: 'The public timeline shows only events recorded for that shipment in Firestore. Swiftstream does not invent scans or imply a live carrier connection when none is configured.' },
  { question: 'Can I request a quote without an account?', answer: 'Yes. Share the route, shipment type, and your contact details. The request is stored for the operations team and you receive a reference on successful submission.' },
  { question: 'What happens when a tracking number is not found?', answer: 'The tracking page explains that no matching shipment exists and lets you try again. It does not reveal customer details or suggest a shipment exists when it does not.' },
  { question: 'Which services can be combined?', answer: 'Road, forwarding, warehousing, and final-mile services can be coordinated as one movement. The final plan depends on the lane, timing, dimensions, and handling requirements you provide.' },
];

export default function HomePage() {
  return <>
    <Hero />
    <section id="tracking" className="relative z-10 -mt-20 bg-transparent"><div className="container"><TrackingWidget variant="floating" /></div></section>
    <NetworkStory />
    <Services />
    <WhySwiftstream />
    <HowItWorks />
    <section className="section bg-ink-50/60"><div className="container grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20"><div><span className="eyebrow">Request a quote</span><h2 className="display-2 mt-5">Tell us what needs to move.</h2><p className="lead mt-5">Share the route and shipment type. The form submits to the server, is validated again there, and is saved for the operations team.</p></div><QuoteLeadForm /></div></section>
    <section className="section bg-surface"><div className="container grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20"><div><span className="eyebrow">Frequently asked</span><h2 className="display-2 mt-5">Straight answers before you ship.</h2></div><Accordion items={FAQ} /></div></section>
    <CTA />
  </>;
}
