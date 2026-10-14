'use client';

import { ArrowRight, CheckCircle2, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HERO_MEDIA } from '@/lib/site';
import { useReducedMotion } from '@/lib/use-reduced-motion';

export function Hero({ tagline = 'Road, air, ocean, warehousing, and final-mile coordination through one accountable logistics team.' }: { tagline?: string }) {
  const reduced = useReducedMotion();
  return (
    <section className="relative isolate min-h-[760px] overflow-hidden bg-night-950 pt-[76px] lg:pt-[112px]">
      <div className="absolute inset-0">
        <video className="h-full w-full object-cover" autoPlay={!reduced} muted loop playsInline poster={HERO_MEDIA.src} aria-label={HERO_MEDIA.video.description}>
          <source src={HERO_MEDIA.video.webm} type="video/webm" /><source src={HERO_MEDIA.video.src} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,7,26,.94)_0%,rgba(4,7,26,.72)_48%,rgba(4,7,26,.2)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night-950/80 to-transparent" />
      </div>
      <div className="container relative flex min-h-[648px] items-center py-20">
        <motion.div initial={reduced ? undefined : { opacity: 0, y: 24 }} animate={reduced ? undefined : { opacity: 1, y: 0 }} transition={{ duration: .75 }} className="max-w-3xl text-white">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[.2em] text-brand-300"><span className="h-px w-10 bg-brand-400" />Connected freight, handled carefully</p>
          <h1 className="mt-6 font-display text-[3.1rem] font-semibold uppercase leading-[.98] tracking-[-.055em] text-white sm:text-6xl lg:text-[5.3rem]">Moving freight.<br /><span className="text-brand-400">Building trust.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl">{tagline}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/quote" className="inline-flex h-14 items-center justify-center gap-2 bg-brand-500 px-7 font-semibold text-night-950 transition hover:bg-brand-400">Request a quote <ArrowRight className="h-4 w-4" /></Link><Link href="/tracking" className="inline-flex h-14 items-center justify-center gap-2 border border-white/40 bg-white/10 px-7 font-semibold text-white backdrop-blur transition hover:bg-white/20"><PackageSearch className="h-4 w-4" />Track shipment</Link></div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">{['Database-backed tracking', 'Human operations support', 'Clear milestone updates'].map((item) => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-400" />{item}</li>)}</ul>
        </motion.div>
      </div>
      <div className="absolute bottom-0 right-0 hidden h-28 w-28 rounded-tl-[5rem] border-l border-t border-brand-400/50 bg-brand-500/10 lg:block" />
    </section>
  );
}
