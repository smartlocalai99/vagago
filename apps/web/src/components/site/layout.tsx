import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

export const navLinks = [
  { href: '/stays/', label: 'Stays' },
  { href: '/#places', label: 'Places to visit' },
  { href: '/#how-it-works', label: 'How booking works' },
  { href: '/trips/', label: 'My bookings' },
];

export function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" aria-label="VagaGo home" className="flex items-center gap-2.5">
    <span className={`grid size-9 place-items-center rounded-[10px] ${light ? 'bg-white/12' : 'bg-forest'}`}>
      <img src="/brand/mark.png" alt="" width={24} height={18} className="w-6" />
    </span>
    <span className={`text-[21px] font-extrabold tracking-[-0.03em] ${light ? 'text-white' : 'text-forest'}`}>VagaGo</span>
  </Link>;
}

function Header() {
  const { asPath } = useRouter();
  return <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6">
      <Logo />
      <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
        {navLinks.map((item) => {
          const current = item.href !== '/#places' && item.href !== '/#how-it-works' && asPath.startsWith(item.href);
          return <Link key={item.href} href={item.href} aria-current={current ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-[15px] font-semibold transition-colors hover:bg-surface ${current ? 'text-forest' : 'text-ink'}`}>{item.label}</Link>;
        })}
      </nav>
      <Link href="/trips/" className="rounded-full border border-line px-4 py-2 text-[14px] font-semibold md:hidden">My bookings</Link>
    </div>
  </header>;
}

function Footer() {
  return <footer className="mt-20 bg-forest text-white">
    <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
      <div className="space-y-3">
        <Logo light />
        <p className="max-w-sm text-[15px] leading-7 text-white/75">Cottages, homestays and villas in Vagamon, Kerala. Book online and pay when you arrive.</p>
      </div>
      <div className="space-y-3">
        <p className="text-[15px] font-bold">Explore</p>
        <ul className="space-y-2 text-[15px] text-white/75">
          <li><Link href="/stays/" className="hover:text-white">All stays</Link></li>
          <li><Link href="/#places" className="hover:text-white">Places to visit</Link></li>
          <li><Link href="/#faq" className="hover:text-white">Questions and answers</Link></li>
        </ul>
      </div>
      <div className="space-y-3">
        <p className="text-[15px] font-bold">Your trip</p>
        <ul className="space-y-2 text-[15px] text-white/75">
          <li><Link href="/trips/" className="hover:text-white">My bookings</Link></li>
          <li><Link href="/#how-it-works" className="hover:text-white">How booking works</Link></li>
          <li><Link href="/credits/" className="hover:text-white">Photo credits</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/10">
      <p className="mx-auto max-w-[1200px] px-4 py-5 text-[13px] text-white/60 sm:px-6">© {new Date().getFullYear()} VagaGo. Stays in Vagamon, Kerala.</p>
    </div>
  </footer>;
}

export function SiteLayout({ title, description, image, children, bare = false, header = true }: { title: string; description: string; image?: string; children: ReactNode; bare?: boolean; header?: boolean }) {
  const fullTitle = title === 'VagaGo' ? 'VagaGo: affordable stays in Vagamon' : `${title} | VagaGo`;
  return <div className="flex min-h-dvh flex-col bg-white text-ink">
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image ?? '/images/hero.jpg'} />
      <meta name="theme-color" content="#FFFFFF" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    </Head>
    {header ? <Header /> : null}
    <main className="flex-1">{children}</main>
    {bare ? null : <Footer />}
  </div>;
}
