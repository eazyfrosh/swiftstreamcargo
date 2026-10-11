/** Swiftstream Cargo's shipment types and internal service catalogue. */
export const SHIPMENT_TYPES = ['Parcel', 'Pallet', 'LTL', 'FTL', 'Container'] as const;
export type ShipmentType = (typeof SHIPMENT_TYPES)[number];

export interface CarrierService {
  code: string;
  name: string;
  transitDays: number;
}

export interface Carrier {
  id: string;
  name: string;
  initials: string;
  trackingUrl: (trackingNumber: string) => string;
  patterns: RegExp[];
  services: CarrierService[];
  handles: ShipmentType[];
}

export interface CarrierMatch {
  carrier: Carrier;
  verified: boolean;
}

export const OWN_CARRIER_ID = 'freightbridge';

const SWIFTSTREAM: Carrier = {
  // Keep the original internal id so existing Firestore records remain valid.
  id: OWN_CARRIER_ID,
  name: 'Swiftstream Cargo',
  initials: 'SC',
  trackingUrl: (trackingNumber) => `/tracking?number=${encodeURIComponent(trackingNumber)}`,
  // FBX is accepted only as a legacy Swiftstream reference after the rebrand.
  patterns: [/^SSC\d{6,12}$/, /^FBX\d{6,12}$/],
  handles: [...SHIPMENT_TYPES],
  services: [
    { code: 'fb-economy', name: 'Economy', transitDays: 7 },
    { code: 'fb-standard', name: 'Standard', transitDays: 4 },
    { code: 'fb-expedited', name: 'Expedited', transitDays: 2 },
    { code: 'fb-same-day', name: 'Same Day', transitDays: 0 },
  ],
};

/** Swiftstream Cargo is the sole shipment and tracking network. */
export const CARRIERS: Carrier[] = [SWIFTSTREAM];
export const BOOKABLE_CARRIERS: Carrier[] = CARRIERS;

const BY_ID = new Map(CARRIERS.map((carrier) => [carrier.id, carrier]));

/** Uppercase and remove spaces and dashes from a pasted reference. */
export function normalizeCarrierNumber(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}

export function carrierById(id: string): Carrier | null {
  return BY_ID.get(id) ?? null;
}

export function detectCarriers(rawInput: string): CarrierMatch[] {
  const value = normalizeCarrierNumber(rawInput);
  return SWIFTSTREAM.patterns.some((pattern) => pattern.test(value))
    ? [{ carrier: SWIFTSTREAM, verified: true }]
    : [];
}

export function detectCarrier(rawInput: string): CarrierMatch | null {
  return detectCarriers(rawInput)[0] ?? null;
}

export function isSwiftstreamNumber(rawInput: string): boolean {
  return /^(SSC|FBX)\d{6,12}$/.test(normalizeCarrierNumber(rawInput));
}

export type CarrierLogos = Record<string, string | undefined>;

export function carriersFor(shipmentType?: string): Carrier[] {
  if (!shipmentType) return BOOKABLE_CARRIERS;
  return SWIFTSTREAM.handles.includes(shipmentType as ShipmentType) ? BOOKABLE_CARRIERS : [];
}

export function carrierService(carrierId: string, serviceCode: string): CarrierService | null {
  return carrierById(carrierId)?.services.find((service) => service.code === serviceCode) ?? null;
}

/** Swiftstream numbers are allocated by the shipment service, not here. */
export function generateCarrierNumber(_carrierId?: string): null {
  return null;
}

export function matchesCarrierFormat(carrierId: string, trackingNumber: string): boolean {
  const carrier = carrierById(carrierId);
  if (!carrier) return false;
  const value = normalizeCarrierNumber(trackingNumber);
  return carrier.patterns.some((pattern) => pattern.test(value));
}
