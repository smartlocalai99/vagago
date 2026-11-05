import { SiteLayout } from '@/components/site/layout';
import { placeCredits } from '@/lib/places';

const names: Record<string, string> = {
  'vagamon-meadows': 'Vagamon Meadows', 'vagamon-pine-forest': 'Vagamon Pine Forest', 'vagamon-lake': 'Vagamon Lake', 'murugan-mala': 'Murugan Mala', kurisumala: 'Kurisumala',
  thangalpara: 'Thangalpara', 'marmala-waterfalls': 'Marmala Waterfalls', 'illikkal-kallu': 'Illikkal Kallu', ilaveezhapoonchira: 'Ilaveezhapoonchira',
};

export default function Credits() {
  return <SiteLayout title="Photo credits" description="Credits for the photographs used on VagaGo.">
    <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6">
      <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Photo credits</h1>
      <p className="mt-2 text-[16px] leading-7 text-muted">Photos of places to visit are from Wikimedia Commons and used under the licences below. They show the places, not VagaGo stays, and do not imply endorsement.</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {Object.entries(placeCredits).map(([slug, credit]) => <li key={slug} className="flex gap-4 py-4">
          <img src={`/places/${slug}.jpg`} alt="" className="size-20 shrink-0 rounded-xl object-cover" loading="lazy" />
          <div className="min-w-0 text-[15px]">
            <p className="font-bold">{names[slug] ?? slug}</p>
            <p className="text-muted">Photo by {credit.author}, <a href={credit.licenseUrl} className="underline" target="_blank" rel="noreferrer">{credit.license}</a></p>
            <a href={credit.source} target="_blank" rel="noreferrer" className="break-all text-[13px] text-muted underline">{credit.title}</a>
          </div>
        </li>)}
        <li className="flex gap-4 py-4">
          <img src="/images/hero.jpg" alt="" className="size-20 shrink-0 rounded-xl object-cover" loading="lazy" />
          <div className="text-[15px]">
            <p className="font-bold">Home page hills</p>
            <p className="text-muted">Photo by Nandhu Kumar on <a href="https://www.pexels.com/photo/foggy-sunrise-over-the-green-mountain-in-kerala-13691356/" className="underline" target="_blank" rel="noreferrer">Pexels</a> (Pexels License)</p>
          </div>
        </li>
      </ul>
    </div>
  </SiteLayout>;
}
