import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';

const tabs: { href: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { href: '/', label: 'Home', icon: 'home', match: (path) => path === '/' },
  { href: '/bookings/', label: 'Bookings', icon: 'calendar', match: (path) => path.startsWith('/bookings') },
  { href: '/hotels/', label: 'Hotels', icon: 'building', match: (path) => path.startsWith('/hotels') },
  { href: '/account/', label: 'Account', icon: 'user', match: (path) => path.startsWith('/account') },
];

export function Shell({ title, back, action, children, footer }: { title: string; back?: string; action?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const router = useRouter();
  return <div className="flex min-h-dvh flex-col">
    <Head><title>{`${title} · VagaGo Admin`}</title></Head>
    <header className="sticky top-0 z-20 flex min-h-14 items-center gap-1 border-b border-line bg-white/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur">
      {back ? <Link href={back} aria-label="Back" className="grid size-11 place-items-center text-ink"><Icon name="back" /></Link> : <span className="w-2" />}
      <h1 className="flex-1 truncate text-[17px] font-bold">{title}</h1>
      {action}
    </header>
    <main className="flex-1 pb-6">{children}</main>
    {footer ? <div className="sticky bottom-0 z-20 border-t border-line bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div> : null}
    {!back && !footer ? <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const active = tab.match(router.pathname.replace(/\/$/, '') || '/');
        return <Link key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${active ? 'font-bold text-forest' : 'font-medium text-muted'}`}>
          <Icon name={tab.icon} size={22} />{tab.label}
        </Link>;
      })}
    </nav> : null}
  </div>;
}
