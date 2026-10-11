import { SettingsForm } from '@/components/admin/SettingsForm';
import { getWebsiteConfig } from '@/lib/operations';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Website settings' };
export default async function SettingsPage() { const config = await getWebsiteConfig(); return <div className="mx-auto max-w-6xl"><h1 className="font-display text-3xl font-semibold text-ink-900">Website settings</h1><p className="mt-2 text-ink-500">Manage the contact details and public brand name stored in Firestore.</p><SettingsForm initial={config} /></div>; }
