import Link from 'next/link';
import { SiteLayout } from '@/components/site/layout';

export default function NotFound() {
  return <SiteLayout title="Page not found" description="This page doesn’t exist.">
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">This page doesn’t exist</h1>
      <p className="mt-2 text-[16px] text-muted">The stay may have been removed, or the link is wrong.</p>
      <Link href="/stays/" className="mt-7 inline-block rounded-full bg-forest px-6 py-3 text-[15px] font-bold text-white">Browse stays</Link>
    </div>
  </SiteLayout>;
}
