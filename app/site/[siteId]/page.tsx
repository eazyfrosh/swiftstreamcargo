import { notFound } from 'next/navigation';
import { TemplateWebsite } from '@/components/eazytools/TemplateWebsite';
import { readWorkspace } from '@/lib/eazytools-workspace';

export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ siteId: string }> }) { const { siteId } = await params; const site = await readWorkspace(siteId); if (!site) notFound(); return <TemplateWebsite initial={site} />; }
