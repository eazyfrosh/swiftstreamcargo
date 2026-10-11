import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** `light` renders for dark backgrounds. */
  tone?: 'dark' | 'light';
  className?: string;
  href?: string;
  showWordmark?: boolean;
  onClick?: () => void;
  name?: string;
}

/** Original Swiftstream Cargo mark: an S-shaped current ending in a forward arrow. */
export function LogoMark({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  const inverted = tone === 'light';
  const stroke = inverted ? '#C24500' : '#FFFFFF';

  return (
    <span
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
        inverted
          ? 'bg-white shadow-[0_6px_18px_-8px_rgba(0,0,0,0.5)]'
          : 'bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_6px_18px_-8px_rgba(226,81,0,0.9)]',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M4 7.25c2.1-2.1 5.2-3 8.3-2.2 2.1.5 3.8 1.7 5.1 3.1"
          stroke={stroke}
          strokeWidth="2.15"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M20 16.2c-2.2 2.3-5.6 3.2-8.9 2.2-2.2-.7-4-2-5.3-3.8"
          stroke={stroke}
          strokeWidth="2.15"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M5 11.8h12.2" stroke={stroke} strokeWidth="2.15" strokeLinecap="round" opacity="0.72" />
        <path d="m14.8 9.2 3 2.6-3 2.6" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  );
}

export function Logo({ tone = 'dark', className, href = '/', showWordmark = true, onClick, name = 'Swiftstream Cargo' }: LogoProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark tone={tone} />
      {showWordmark && (
        <span
          className={cn(
            'font-display text-[1.28rem] font-semibold tracking-[-0.03em]',
            tone === 'light' ? 'text-white' : 'text-ink-900',
          )}
        >
          {name}
        </span>
      )}
    </span>
  );

  return (
    <Link href={href} onClick={onClick} aria-label={`${name} — home`} className="inline-flex rounded-xl">
      {content}
    </Link>
  );
}
