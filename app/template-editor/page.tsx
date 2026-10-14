import { redirect } from 'next/navigation';
import { TemplateEditor } from '@/components/eazytools/TemplateEditor';
import { currentOwner } from '@/lib/eazytools-workspace';

export const dynamic = 'force-dynamic';
export default async function Page() { if (!await currentOwner()) redirect('/?templateError=session-expired'); return <TemplateEditor />; }
