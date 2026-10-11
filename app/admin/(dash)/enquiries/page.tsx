import { EnquiryManager } from '@/components/admin/EnquiryManager';
import { listEnquiries } from '@/lib/operations';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Enquiries' };

export default async function EnquiriesPage() {
  const enquiries = await listEnquiries();
  return <div className="mx-auto max-w-6xl"><h1 className="font-display text-3xl font-semibold text-ink-900">Quote & contact enquiries</h1><p className="mt-2 text-ink-500">Review, search, progress, resolve, or archive every public form submission.</p><EnquiryManager initial={enquiries} /></div>;
}
