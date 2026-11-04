import Link from 'next/link';
import { useRouter } from 'next/router';
import { Shell } from '@/components/shell';
import { Icon } from '@/components/icons';
import { Button, Empty, Loading, Row, StatusPill } from '@/components/ui';
import { useProperties, type PropertyStatus } from '@/lib/data';
import { thumbUrl } from '@/lib/supabase';

const filters: { id: PropertyStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Live' },
  { id: 'draft', label: 'Draft' },
  { id: 'in_review', label: 'In review' },
  { id: 'suspended', label: 'Suspended' },
];

export default function Hotels() {
  const router = useRouter();
  const filter = filters.find((item) => item.id === router.query.filter)?.id ?? 'all';
  const { data: hotels, isLoading } = useProperties();
  const visible = (hotels ?? []).filter((hotel) => filter === 'all' || hotel.status === filter);
  const add = <Link href="/hotels/new/" className="mr-1 flex min-h-10 items-center gap-1 rounded-full bg-forest px-3.5 text-[13px] font-bold text-white"><Icon name="plus" size={16} />Add hotel</Link>;

  return <Shell title="Hotels" action={add}>
    <div className="flex gap-1.5 overflow-x-auto px-4 py-3">
      {filters.map((item) => {
        const count = item.id === 'all' ? hotels?.length : hotels?.filter((hotel) => hotel.status === item.id).length;
        return <button key={item.id} onClick={() => void router.replace({ query: { filter: item.id } }, undefined, { shallow: true })}
          className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${filter === item.id ? 'bg-forest text-white' : 'bg-surface'}`}>
          {item.label} <span className="tabular-nums opacity-70">{count ?? ''}</span>
        </button>;
      })}
    </div>
    {isLoading ? <Loading /> : visible.length ? <div className="border-t border-line">
      {visible.map((hotel) => {
        const cover = hotel.property_photos[0]?.storage_path;
        const rooms = hotel.room_types[0]?.count ?? 0;
        return <Row key={hotel.id} href={`/hotels/edit/?id=${hotel.id}`}>
          {cover ? <img src={thumbUrl(cover)} alt="" loading="lazy" decoding="async" className="size-14 shrink-0 rounded-xl object-cover" />
            : <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-surface text-muted"><Icon name="camera" /></div>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><p className="truncate text-[15px] font-semibold">{hotel.name}</p><StatusPill property={hotel.status} /></div>
            <p className="truncate text-[13px] text-muted"><span className="capitalize">{hotel.stay_style}</span> · {hotel.area} · {rooms} {rooms === 1 ? 'room type' : 'room types'}</p>
          </div>
        </Row>;
      })}
    </div> : <Empty icon="building" title={filter === 'all' ? 'No hotels yet' : 'Nothing in this list'} body="Add a hotel to start onboarding it. It stays hidden from guests until you publish it."
      action={<Link href="/hotels/new/"><Button>Add a hotel</Button></Link>} />}
  </Shell>;
}
