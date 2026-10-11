import type { ReactNode } from 'react';
import { ChatWidget } from '@/components/ChatWidget';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { VisitorTracker } from '@/components/VisitorTracker';
import { getWebsiteConfig } from '@/lib/operations';

/**
 * Chrome for the public marketing site. The admin section sits outside this
 * group so it never inherits the customer-facing navbar and footer — which is
 * also what keeps the chat widget off the operator's own screens.
 */
export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const config = await getWebsiteConfig();
  return (
    <>
      <Navbar config={config} />
      <main id="main">{children}</main>
      <Footer config={config} />
      <WhatsAppButton />
      <ChatWidget />
      <VisitorTracker />
    </>
  );
}
