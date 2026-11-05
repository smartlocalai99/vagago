import { SiteLayout } from '@/components/site/layout';
import { amenityCredits, placeCredits, type PhotoCredit } from '@/lib/places';

const names: Record<string, string> = {
  'vagamon-meadows': 'Vagamon Meadows', 'vagamon-pine-forest': 'Vagamon Pine Forest', 'vagamon-lake': 'Vagamon Lake', 'murugan-mala': 'Murugan Mala', kurisumala: 'Kurisumala',
  thangalpara: 'Thangalpara', 'paragliding-point': 'Paragliding point', 'marmala-waterfalls': 'Marmala Waterfalls', 'illikkal-kallu': 'Illikkal Kallu', ilaveezhapoonchira: 'Ilaveezhapoonchira',
};

function CreditRow({ image, name, credit }: { image: string; name: string; credit: PhotoCredit }) {
  return <li className="flex gap-4 py-4">
    <img src={image} alt="" className="size-20 shrink-0 rounded-xl object-cover" loading="lazy" />
    <div className="min-w-0 text-[15px]">
      <p className="font-bold">{name}</p>
      <p className="text-muted">Photo by {credit.author}, <a href={credit.licenseUrl} className="underline" target="_blank" rel="noreferrer">{credit.license}</a></p>
      {credit.note ? <p className="text-[13px] text-muted">{credit.note}</p> : null}
      <a href={credit.source} target="_blank" rel="noreferrer" className="break-all text-[13px] text-muted underline">{credit.title}</a>
    </div>
  </li>;
}

export default function Credits() {
  return <SiteLayout title="Photo credits" description="Credits for the photographs used on VagaGo.">
    <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6">
      <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Photo credits</h1>
      <p className="mt-2 text-[16px] leading-7 text-muted">Photos of places to visit are from Wikimedia Commons and used under the licences below. They show the places, not VagaGo stays, and do not imply endorsement.</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {Object.entries(placeCredits).map(([slug, credit]) => <CreditRow key={slug} image={`/places/${slug}.jpg`} name={names[slug] ?? slug} credit={credit} />)}
        <li className="flex gap-4 py-4">
          <img src="/images/hero.jpg" alt="" className="size-20 shrink-0 rounded-xl object-cover" loading="lazy" />
          <div className="text-[15px]">
            <p className="font-bold">Home page hills</p>
            <p className="text-muted">Photo by Nandhu Kumar on <a href="https://www.pexels.com/photo/foggy-sunrise-over-the-green-mountain-in-kerala-13691356/" className="underline" target="_blank" rel="noreferrer">Pexels</a> (Pexels License)</p>
          </div>
        </li>
      </ul>
      <h2 className="mt-12 text-[22px] font-extrabold tracking-[-0.02em]">Amenity photos</h2>
      <p className="mt-1 text-[15px] text-muted">Representative photos that illustrate each amenity; they are not photos of VagaGo stays.</p>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {Object.entries(amenityCredits).map(([key, credit]) => <CreditRow key={key} image={`/amenities/${key}.jpg`} name={credit.label ?? key} credit={credit} />)}
      </ul>
    </div>
  </SiteLayout>;
}
