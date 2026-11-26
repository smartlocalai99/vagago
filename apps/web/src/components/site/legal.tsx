import type { ReactNode } from 'react';
import { SiteLayout } from '@/components/site/layout';

export function LegalPage({ title, description, updated, children }: { title: string; description: string; updated?: string; children: ReactNode }) {
  return <SiteLayout title={title} description={description}>
    <article className="mx-auto max-w-[760px] px-4 py-12 sm:px-6">
      <h1 className="text-[34px] font-extrabold tracking-[-0.03em]">{title}</h1>
      {updated ? <p className="mt-1 text-[14px] text-muted">Last updated {updated}</p> : null}
      <div className="mt-8 space-y-6 text-[16px] leading-7 text-ink/85 [&_h2]:mt-10 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">{children}</div>
    </article>
  </SiteLayout>;
}
