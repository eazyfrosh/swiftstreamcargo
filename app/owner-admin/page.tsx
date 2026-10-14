import { redirect } from 'next/navigation';
import { OwnerAdmin } from '@/components/eazytools/OwnerAdmin';
import { currentOwner } from '@/lib/eazytools-workspace';

export const dynamic = 'force-dynamic';
export default async function Page() { if (!await currentOwner()) redirect('/?templateError=session-expired'); return <OwnerAdmin />; }
