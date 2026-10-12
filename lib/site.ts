import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  Clock4,
  Globe2,
  Headphones,
  LifeBuoy,
  MapPin,
  Network,
  PackageSearch,
  Plane,
  Route,
  ShieldCheck,
  Ship,
  Truck,
  Warehouse,
} from 'lucide-react';

export const SITE = {
  name: 'Swiftstream Cargo',
  tagline: 'Cargo in Motion. Confidence at Every Mile.',
  description:
    'Swiftstream Cargo provides reliable freight transportation, delivery, warehousing, and supply chain solutions for modern businesses.',
  url: 'https://www.swiftstreamcargo.com',
  email: 'hello@swiftstreamcargo.com',
  phone: '+1 (312) 555-0142',
  address: '210 Harbor Point Drive, Suite 900, Chicago, IL 60601',
} as const;

/**
 * Hero photography.
 *
 * To use your own shot, drop it in `public/images/` and point `src` at it —
 * e.g. `/images/hero-freight.jpg`. No other change is needed. For a hosted
 * image, add the host to `images.remotePatterns` in `next.config.mjs` first.
 *
 * The default below is a stock placeholder. If it fails to load, the hero
 * renders `fallbackSrc` instead of breaking.
 *
 * Aim for a landscape shot around 1600×1200 or wider. The frame crops to
 * `object-cover`, and a scrim sits over the lower third — keep the subject
 * out of the bottom-left corner, where the shipment card overlaps.
 */
export const HERO_MEDIA = {
  /**
   * Set `video.src` to show a looping background clip instead of the still.
   * Drop an MP4 in `public/video/` and reference it as `/video/<name>.mp4`.
   * Leave it empty to use the still image below.
   *
   * Keep it short (6–10s), silent, and compressed — under ~3 MB. It is
   * muted and `playsInline` so mobile browsers will autoplay it, it is
   * suppressed entirely under `prefers-reduced-motion`, and it carries a
   * pause control.
   */
  video: {
    src: '/video/hero-freight.mp4',
    webm: '/video/hero-freight.webm',
    description: 'Freight moving through a Swiftstream Cargo distribution network',
  } satisfies VideoAsset,

  /** Still image — the poster for the video, and the hero when there is none. */
  src: '/images/hero-freight.png',
  alt: 'An articulated lorry hauling a shipping container along a multi-lane highway',
  fallbackSrc: '/images/hero-freight.svg',
  fallbackAlt:
    'Illustration of a Swiftstream Cargo semi-truck travelling a highway at dusk past a container yard and gantry cranes',
} as const;

/** A looping background clip. Leave `src` empty to fall back to the still. */
export interface VideoAsset {
  src: string;
  webm?: string;
  description?: string;
}

/**
 * A swappable image. `src` is what renders; `fallbackSrc` is the bundled
 * illustration used if that file cannot be loaded.
 */
export interface MediaAsset {
  src: string;
  alt: string;
  fallbackSrc: string;
  fallbackAlt?: string;
}

/**
 * Section imagery.
 *
 * Every entry ships pointing at its bundled illustration. To use photographs,
 * drop the files in `public/images/` and change `src` — one line per image,
 * nothing else. Alt text lives here too, so update it to describe your photo.
 * If a `src` is missing or mistyped the illustration renders instead, so a
 * typo degrades rather than breaking the page.
 *
 * Landscape, 1600px wide or more. Each is cropped with `object-cover`.
 */
export const IMAGERY: Record<'road' | 'port' | 'warehouse' | 'lastMile' | 'driver', MediaAsset> = {
  /** Poster for ROAD_VIDEO — a frame from that clip, so the two match. */
  driver: {
    src: '/images/on-the-road.jpg',
    alt: 'A Swiftstream Cargo delivery driver holding a clipboard at a customer’s gate',
    fallbackSrc: '/images/hero-freight.svg',
    fallbackAlt: 'Illustration of a Swiftstream Cargo truck on the highway beside a container yard',
  },
  road: {
    src: '/images/hero-freight.png',
    alt: 'An articulated lorry hauling a shipping container along a multi-lane highway',
    fallbackSrc: '/images/hero-freight.svg',
    fallbackAlt: 'Illustration of a Swiftstream Cargo truck on the highway beside a container yard',
  },
  port: {
    src: '/images/port-terminal.png',
    alt: 'Shipping containers stacked in rows beneath gantry cranes at a busy port terminal',
    fallbackSrc: '/images/port-terminal.svg',
    fallbackAlt: 'Illustration of gantry cranes loading containers onto a cargo ship',
  },
  lastMile: {
    src: '/images/inside-the-network.jpg',
    alt: 'A woman smiling as she receives two parcels at her front door',
    fallbackSrc: '/images/warehouse-ops.svg',
    fallbackAlt: 'Illustration of a Swiftstream Cargo fulfillment warehouse with pallet racking and a forklift',
  },
  warehouse: {
    src: '/images/warehouse-ops.png',
    alt: 'Two warehouse workers walking between tall pallet racks, one carrying a box',
    fallbackSrc: '/images/warehouse-ops.svg',
    fallbackAlt: 'Illustration of a Swiftstream Cargo fulfillment warehouse with pallet racking and a forklift',
  },
};

/**
 * The clip in the "Inside the network" section.
 *
 * Drop an MP4 in `public/video/` and set `src` to `/video/<name>.mp4`. Leave
 * it empty and the section shows `IMAGERY.warehouse` on its own — no gap, no
 * broken frame. Same budget as the hero clip: 6–10s, silent, under ~3 MB, 720p
 * is plenty. See the README for the ffmpeg recipe.
 */
export const STORY_VIDEO: VideoAsset = {
  src: '/video/inside-the-network.mp4',
  webm: '/video/inside-the-network.webm',
  description: 'A Swiftstream Cargo delivery being handed over at a customer’s front door',
};

/**
 * The clip in the "Every delivery has a name on it" section.
 *
 * To replace it, overwrite `public/video/on-the-road.mp4` (and the `.webm`
 * beside it, or delete that file and drop the `webm` line below). Keep the
 * poster `IMAGERY.driver` in step with the footage — a mismatched poster
 * flashes the wrong image before the clip fades in.
 *
 * Budget: 6–10s, silent, under ~3 MB, 720p. The frame renders about 500 px
 * tall, so a 4K master is many times the bytes for no visible gain. Strip the
 * audio track too — the clip is muted, so it is dead weight. Recipe:
 *
 *   ffmpeg -i master.mp4 -vf scale=1280:-2 -c:v libx264 -crf 26 -preset slow \
 *          -pix_fmt yuv420p -an -movflags +faststart on-the-road.mp4
 */
export const ROAD_VIDEO: VideoAsset = {
  src: '/video/on-the-road.mp4',
  webm: '/video/on-the-road.webm',
  description: 'A Swiftstream Cargo delivery driver collecting a signature at a customer’s gate',
};

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
}

export interface NavItem {
  label: string;
  href: string;
  /** Present for items that open a dropdown panel on desktop. */
  children?: NavLink[];
  featured?: { title: string; body: string; href: string; cta: string };
}

export const SERVICES: Array<{
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  highlights: string[];
}> = [
  {
    slug: 'air-freight', title: 'Air Freight', tagline: 'Priority movement for time-sensitive cargo.',
    description: 'Airport-to-airport and door-to-door coordination with documentation, handoffs, and milestones managed in one record.',
    icon: Plane, highlights: ['Priority and economy options', 'Export documentation support', 'Door-to-door coordination'],
  },
  {
    slug: 'sea-freight', title: 'Sea Freight', tagline: 'Flexible ocean options for global supply chains.',
    description: 'FCL and LCL coordination with clear origin, port, customs, and destination milestones stored against the shipment.',
    icon: Ship, highlights: ['FCL and LCL options', 'Port coordination', 'Customs documentation support'],
  },
  {
    slug: 'road-transport', title: 'Road Transport', tagline: 'Reliable regional and long-haul road freight.',
    description: 'Full-load, part-load, and dedicated vehicle planning with recorded pickup, facility, transit, and delivery events.',
    icon: Truck, highlights: ['Full and partial loads', 'Dedicated vehicle options', 'Scheduled milestone updates'],
  },
  {
    slug: 'warehousing', title: 'Warehousing', tagline: 'Flexible storage and fulfillment operations.',
    description: 'Short-term overflow, cross-docking, and fulfillment support shaped around your inventory and dispatch needs.',
    icon: Warehouse, highlights: ['Pick, pack and fulfillment', 'Cross-docking', 'Inventory handling'],
  },
  {
    slug: 'express-delivery', title: 'Express Delivery', tagline: 'Direct delivery for urgent consignments.',
    description: 'Priority pickup and point-to-point delivery with every public update tied to a recorded operations event.',
    icon: Clock4, highlights: ['Priority pickup planning', 'Direct point-to-point options', 'Recorded exception handling'],
  },
];

export const SOLUTIONS: NavLink[] = [
  {
    label: 'Retail & E-commerce',
    href: '/services#solutions',
    description: 'Fulfillment and last-mile built for order volume that spikes.',
    icon: Boxes,
  },
  {
    label: 'Manufacturing',
    href: '/services#solutions',
    description: 'Inbound materials and outbound freight on dependable lanes.',
    icon: Warehouse,
  },
  {
    label: 'Cross-Border Trade',
    href: '/services#solutions',
    description: 'Forwarding and customs documentation support for international routes.',
    icon: Globe2,
  },
  {
    label: 'Enterprise Logistics',
    href: '/services#solutions',
    description: 'Managed transportation for multi-site operations.',
    icon: ShieldCheck,
  },
];

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Solutions',
    href: '/services#solutions',
    children: SOLUTIONS,
    featured: {
      title: 'Not sure where to start?',
      body: 'Tell us what you move and we will map the lanes, modes, and costs in one working session.',
      href: '/quote',
      cta: 'Get a quote',
    },
  },
  {
    label: 'Services',
    href: '/services',
    children: SERVICES.map((service) => ({
      label: service.title,
      href: `/services/${service.slug}`,
      description: service.tagline,
      icon: service.icon,
    })),
  },
  { label: 'Tracking', href: '/tracking' },
  {
    label: 'Resources',
    href: '/tracking',
    children: [
      {
        label: 'Track a shipment',
        href: '/tracking',
        description: 'Live status, timeline, and delivery estimates.',
        icon: PackageSearch,
      },
      {
        label: 'Shipping guide',
        href: '/resources/shipping-guide',
        description: 'Packaging, classes, and paperwork explained.',
        icon: Route,
      },
      {
        label: 'FAQ',
        href: '/resources/faq',
        description: 'Answers to the questions shippers ask most.',
        icon: LifeBuoy,
      },
      {
        label: 'Support',
        href: '/contact',
        description: 'Reach the logistics support team.',
        icon: Headphones,
      },
    ],
  },
  {
    label: 'Company',
    href: '/about',
    children: [
      { label: 'About', href: '/about', description: 'Why we built Swiftstream Cargo.', icon: Globe2 },
      { label: 'Contact', href: '/contact', description: 'Talk to sales, support, or dispatch.', icon: Headphones },
    ],
  },
];

export const FOOTER_COLUMNS: Array<{ title: string; links: NavLink[] }> = [
  {
    title: 'Solutions',
    links: [
      { label: 'Air Freight', href: '/services/air-freight' },
      { label: 'Sea Freight', href: '/services/sea-freight' },
      { label: 'Road Transport', href: '/services/road-transport' },
      { label: 'Warehousing', href: '/services/warehousing' },
      { label: 'Express Delivery', href: '/services/express-delivery' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Tracking', href: '/tracking' },
      { label: 'Shipping Guide', href: '/resources/shipping-guide' },
      { label: 'FAQ', href: '/resources/faq' },
      { label: 'Support', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Cookie Policy', href: '/legal/cookies' },
    ],
  },
];

/**
 * Coverage-map nodes. `x`/`y` are positions inside the map's 860 × 420 viewBox —
 * a stylised arrangement of our regions, not a geographic projection.
 */
export const REGIONS = [
  { name: 'United States', code: 'US', hubs: 18, x: 158, y: 232, anchor: 'below' },
  { name: 'Canada', code: 'CA', hubs: 6, x: 196, y: 132, anchor: 'above' },
  { name: 'United Kingdom', code: 'UK', hubs: 5, x: 438, y: 152, anchor: 'above' },
  { name: 'Europe', code: 'EU', hubs: 12, x: 530, y: 208, anchor: 'right' },
  { name: 'UAE', code: 'AE', hubs: 4, x: 654, y: 288, anchor: 'right' },
] as const;

export type Region = (typeof REGIONS)[number];

/** Region-to-region lanes drawn as animated arcs on the coverage map. */
export const LANES: Array<[string, string]> = [
  ['US', 'UK'],
  ['US', 'CA'],
  ['CA', 'UK'],
  ['UK', 'EU'],
  ['EU', 'AE'],
  ['US', 'EU'],
];
