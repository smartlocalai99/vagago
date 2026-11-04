import { useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { Button, Field, Input, StatusPill, TextArea } from '@/components/ui';
import {
  deletePhoto, deleteRoom, makeCover, saveAmenities, saveLocation, saveRoom, updateProperty, uploadPhotos,
  useAmenities, type PropertyDetail, type RoomRow,
} from '@/lib/data';
import { thumbUrl } from '@/lib/supabase';

type StepProps = { hotel: PropertyDetail; formId: string; onDone: () => void; onError: (message: string | null) => void };

const message = (caught: unknown, fallback: string) => caught instanceof Error ? caught.message : fallback;

// ---------- Location ----------
// Accepts "9.6762, 76.9018" or a full Google Maps link (…/@9.67,76.90,… or ?q=9.67,76.90 or !3d9.67!4d76.90).
export function parseCoordinates(text: string): { latitude: number; longitude: number } | null {
  const patterns = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|ll|query|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const latitude = Number(match[1]);
      const longitude = Number(match[2]);
      if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return { latitude, longitude };
    }
  }
  return null;
}

export function LocationStep({ hotel, formId, onDone, onError }: StepProps) {
  const saved = hotel.property_locations;
  const [address, setAddress] = useState(saved?.address_line ?? '');
  const [postalCode, setPostalCode] = useState(saved?.postal_code ?? '685503');
  const [coords, setCoords] = useState(saved ? `${saved.latitude}, ${saved.longitude}` : '');
  const [phone, setPhone] = useState(saved?.contact_phone ?? '');
  const [instructions, setInstructions] = useState(saved?.arrival_instructions ?? '');
  const [locating, setLocating] = useState(false);
  const parsed = parseCoordinates(coords);

  const useHere = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => { setCoords(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`); setLocating(false); },
      () => { onError('Couldn’t get your location. Allow location access, or paste the map pin instead.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (address.trim().length < 5) return onError('Enter the full street address.');
    if (!/^\d{6}$/.test(postalCode)) return onError('Enter a 6-digit PIN code.');
    if (!parsed) return onError('Add the map position: use your current location or paste a Google Maps link.');
    const contact = phone.replace(/[\s-]/g, '');
    if (contact && !/^\+?\d{10,15}$/.test(contact)) return onError('Enter a valid contact number.');
    onError(null);
    try {
      await saveLocation(hotel.id, {
        address_line: address.trim(), postal_code: postalCode, latitude: parsed.latitude, longitude: parsed.longitude,
        contact_phone: contact || null, arrival_instructions: instructions.trim() || null,
      });
      onDone();
    } catch (caught) { onError(message(caught, 'Couldn’t save the location.')); }
  };

  return <form id={formId} onSubmit={(event) => void submit(event)} className="space-y-5 px-4 pt-5">
    <p className="rounded-xl bg-surface px-4 py-3 text-[13px] leading-5 text-muted">Guests only see the exact address and map pin after they book.</p>
    <Field label="Street address"><TextArea rows={2} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Pine Valley Road, near Vagamon Pine Forest" /></Field>
    <Field label="PIN code"><Input inputMode="numeric" maxLength={6} value={postalCode} onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, ''))} /></Field>
    <Field label="Map position" hint={parsed ? `Pinned at ${parsed.latitude.toFixed(5)}, ${parsed.longitude.toFixed(5)}` : 'Paste a Google Maps link (open the pin, Share → Copy link from the browser) or “latitude, longitude”.'}
      error={coords && !parsed ? 'Couldn’t read a position from this. Short maps.app.goo.gl links need to be opened first, then copy the full link.' : null}>
      <Input value={coords} onChange={(event) => setCoords(event.target.value)} placeholder="9.6762, 76.9018" />
    </Field>
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="secondary" disabled={locating} onClick={useHere}><span className="inline-flex items-center gap-1.5"><Icon name="locate" size={18} />{locating ? 'Locating…' : 'I’m at the hotel'}</span></Button>
      <a href={parsed ? `https://www.google.com/maps?q=${parsed.latitude},${parsed.longitude}` : undefined} target="_blank" rel="noreferrer"
        className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-forest-soft font-bold text-forest ${parsed ? '' : 'pointer-events-none opacity-45'}`}><Icon name="pin" size={18} />Check on map</a>
    </div>
    <Field label="Contact number for guests" hint="Shown to guests after booking."><Input type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="9876543210" /></Field>
    <Field label="Arrival instructions" hint="Optional. Landmarks, parking, the last stretch of road."><TextArea rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)} /></Field>
  </form>;
}

// ---------- Rooms ----------
type RoomDraft = { id?: string; name: string; max_guests: string; bedrooms: string; beds: string; total_units: string; rate: string; compare: string; description: string; is_active: boolean };
const toDraft = (room?: RoomRow): RoomDraft => room ? {
  id: room.id, name: room.name, max_guests: String(room.max_guests), bedrooms: String(room.bedrooms), beds: room.beds ?? '',
  total_units: String(room.total_units), rate: String(room.base_rate_paise / 100), compare: room.compare_at_paise ? String(room.compare_at_paise / 100) : '',
  description: room.description ?? '', is_active: room.is_active,
} : { name: '', max_guests: '2', bedrooms: '1', beds: '', total_units: '1', rate: '', compare: '', description: '', is_active: true };

function RoomEditor({ hotel, room, onClose, onError }: { hotel: PropertyDetail; room?: RoomRow; onClose: () => void; onError: (message: string | null) => void }) {
  const [draft, setDraft] = useState(() => toDraft(room));
  const [busy, setBusy] = useState(false);
  const set = (key: keyof RoomDraft, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }));
  const numberField = (key: keyof RoomDraft, label: string, hint?: string) => <Field label={label} hint={hint}>
    <Input inputMode="numeric" value={draft[key] as string} onChange={(event) => set(key, event.target.value.replace(/\D/g, ''))} />
  </Field>;

  const save = async () => {
    const rate = Number(draft.rate);
    const compare = draft.compare ? Number(draft.compare) : null;
    if (draft.name.trim().length < 2) return onError('Name this room type, for example “Entire cottage” or “Deluxe room”.');
    if (!rate) return onError('Enter the nightly price.');
    if (compare !== null && compare <= rate) return onError('The original price must be higher than the nightly price.');
    if (!Number(draft.max_guests)) return onError('Enter how many guests fit.');
    setBusy(true);
    onError(null);
    try {
      await saveRoom(hotel.id, {
        id: draft.id, property_id: hotel.id, name: draft.name.trim(), description: draft.description.trim() || null,
        max_guests: Number(draft.max_guests), bedrooms: Number(draft.bedrooms || 0), beds: draft.beds.trim() || null,
        total_units: Number(draft.total_units || 1), base_rate_paise: rate * 100, compare_at_paise: compare ? compare * 100 : null,
        is_active: draft.is_active, sort_order: room?.sort_order ?? hotel.room_types.length,
      });
      onClose();
    } catch (caught) { onError(message(caught, 'Couldn’t save this room.')); }
    setBusy(false);
  };

  const remove = async () => {
    if (!room || !window.confirm(`Delete “${room.name}”?`)) return;
    setBusy(true);
    try {
      await deleteRoom(hotel.id, room.id);
      onClose();
    } catch {
      onError('This room has bookings, so it can’t be deleted. Turn off “Available to book” instead.');
    }
    setBusy(false);
  };

  return <div className="space-y-4 border-y border-line bg-surface px-4 py-5">
    <Field label="Room type name"><Input value={draft.name} onChange={(event) => set('name', event.target.value)} placeholder="Entire cottage" /></Field>
    <div className="grid grid-cols-2 gap-3">
      {numberField('max_guests', 'Max guests')}
      {numberField('bedrooms', 'Bedrooms')}
      {numberField('rate', 'Price per night (₹)')}
      {numberField('compare', 'Original price (₹)', 'Optional, shown struck out')}
      {numberField('total_units', 'How many of these', 'Rooms of this type')}
      <Field label="Beds"><Input value={draft.beds} onChange={(event) => set('beds', event.target.value)} placeholder="1 king bed" /></Field>
    </div>
    <Field label="Description"><TextArea rows={2} value={draft.description} onChange={(event) => set('description', event.target.value)} /></Field>
    <label className="flex items-center justify-between gap-3 text-[14px] font-semibold">
      Available to book
      <input type="checkbox" checked={draft.is_active} onChange={(event) => set('is_active', event.target.checked)} className="size-5 accent-forest" />
    </label>
    <div className="flex gap-2">
      <Button type="button" className="flex-1" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save room'}</Button>
      <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Close</Button>
    </div>
    {room ? <button type="button" onClick={() => void remove()} className="text-[13px] font-semibold text-danger">Delete this room type</button> : null}
  </div>;
}

export function RoomsStep({ hotel, onError }: StepProps) {
  const [editing, setEditing] = useState<string | 'new' | null>(hotel.room_types.length ? null : 'new');
  return <div className="pt-4">
    <p className="px-4 pb-3 text-[13px] text-muted">Add each kind of room guests can book. For a whole cottage or villa, add one “Entire …” type.</p>
    <div className="border-t border-line">
      {hotel.room_types.map((room) => editing === room.id
        ? <RoomEditor key={room.id} hotel={hotel} room={room} onClose={() => setEditing(null)} onError={onError} />
        : <button key={room.id} type="button" onClick={() => setEditing(room.id)} className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left active:bg-surface">
          <div className="grid size-10 place-items-center rounded-xl bg-forest-soft text-forest"><Icon name="bed" size={20} /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{room.name}{room.is_active ? '' : ' · Off'}</p>
            <p className="text-[13px] text-muted">₹{(room.base_rate_paise / 100).toLocaleString('en-IN')}/night · up to {room.max_guests} guests · {room.total_units} {room.total_units === 1 ? 'unit' : 'units'}</p>
          </div>
          <Icon name="chevron" size={16} className="text-muted" />
        </button>)}
      {editing === 'new' ? <RoomEditor hotel={hotel} onClose={() => setEditing(null)} onError={onError} />
        : <button type="button" onClick={() => setEditing('new')} className="flex w-full items-center gap-2 px-4 py-4 text-[15px] font-bold text-forest"><Icon name="plus" size={18} />Add room type</button>}
    </div>
  </div>;
}

// ---------- Photos ----------
export function PhotosStep({ hotel, onError }: StepProps) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const photos = hotel.property_photos;

  const upload = async (files: FileList | null) => {
    const list = Array.from(files ?? []).filter((file) => file.type.startsWith('image/'));
    if (!list.length) return;
    onError(null);
    setUploading({ done: 0, total: list.length });
    try {
      await uploadPhotos(hotel.id, list, photos.length, (done) => setUploading({ done, total: list.length }));
    } catch (caught) { onError(message(caught, 'A photo couldn’t be uploaded. Try again.')); }
    setUploading(null);
    if (input.current) input.current.value = '';
  };

  const act = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try { await action(); } catch (caught) { onError(message(caught, 'Couldn’t update this photo.')); }
    setBusyId(null);
  };

  return <div className="px-4 pt-4">
    <p className="pb-3 text-[13px] text-muted">The first photo is the cover in the app. Add at least 3: outside, the room, and the view. Photos are resized before upload.</p>
    <input ref={input} type="file" accept="image/*" multiple hidden onChange={(event) => void upload(event.target.files)} />
    <Button type="button" variant="secondary" className="w-full" disabled={Boolean(uploading)} onClick={() => input.current?.click()}>
      <span className="inline-flex items-center gap-2"><Icon name="camera" size={18} />{uploading ? `Uploading ${uploading.done + 1 > uploading.total ? uploading.total : uploading.done + 1} of ${uploading.total}…` : 'Add photos'}</span>
    </Button>
    <div className="mt-4 grid grid-cols-2 gap-2">
      {photos.map((photo, index) => <figure key={photo.id} className={`relative overflow-hidden rounded-xl bg-surface ${busyId === photo.id ? 'opacity-50' : ''}`}>
        <img src={thumbUrl(photo.storage_path)} alt={`Photo ${index + 1}`} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
        {index === 0 ? <span className="absolute top-2 left-2 rounded-full bg-forest px-2 py-0.5 text-[11px] font-bold text-white">Cover</span> : null}
        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/50 to-transparent p-1.5">
          {index > 0 ? <button type="button" aria-label="Make cover photo" onClick={() => void act(photo.id, () => makeCover(hotel.id, photos, photo.id))}
            className="grid size-9 place-items-center rounded-full bg-white/90 text-ink"><Icon name="star" size={17} /></button> : null}
          <button type="button" aria-label="Delete photo" onClick={() => window.confirm('Delete this photo?') && void act(photo.id, () => deletePhoto(hotel.id, photo))}
            className="grid size-9 place-items-center rounded-full bg-white/90 text-danger"><Icon name="trash" size={17} /></button>
        </div>
      </figure>)}
    </div>
  </div>;
}

// ---------- Amenities ----------
export function AmenitiesStep({ hotel, formId, onDone, onError }: StepProps) {
  const { data: amenities } = useAmenities();
  const previous = hotel.property_amenities.map((item) => item.amenity_id);
  const [selected, setSelected] = useState(previous);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    onError(null);
    try {
      await saveAmenities(hotel.id, previous, selected);
      onDone();
    } catch (caught) { onError(message(caught, 'Couldn’t save amenities.')); }
  };
  return <form id={formId} onSubmit={(event) => void submit(event)} className="px-4 pt-4">
    <p className="pb-3 text-[13px] text-muted">Pick everything guests can use.</p>
    <div className="flex flex-wrap gap-2">
      {(amenities ?? []).map((amenity) => {
        const on = selected.includes(amenity.id);
        return <button key={amenity.id} type="button" aria-pressed={on} onClick={() => toggle(amenity.id)}
          className={`flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[14px] font-semibold ${on ? 'border-forest bg-forest text-white' : 'border-line'}`}>
          {on ? <Icon name="check" size={16} /> : null}{amenity.name}
        </button>;
      })}
    </div>
  </form>;
}

// ---------- Publish ----------
export function checklist(hotel: PropertyDetail) {
  return [
    { label: 'Name, type and area', done: Boolean(hotel.name && hotel.area), step: 'basics' },
    { label: 'Exact address and map pin', done: Boolean(hotel.property_locations), step: 'location' },
    { label: 'At least one bookable room', done: hotel.room_types.some((room) => room.is_active), step: 'rooms' },
    { label: 'At least one photo', done: hotel.property_photos.length > 0, step: 'photos' },
  ];
}

export function PublishStep({ hotel, onError, onJump }: StepProps & { onJump: (step: string) => void }) {
  const [busy, setBusy] = useState(false);
  const items = checklist(hotel);
  const ready = items.every((item) => item.done);
  const setStatus = async (status: PropertyDetail['status']) => {
    setBusy(true);
    onError(null);
    try { await updateProperty(hotel.id, { status }); } catch (caught) { onError(message(caught, 'Couldn’t change the status.')); }
    setBusy(false);
  };

  return <div className="px-4 pt-5">
    <div className="flex items-center justify-between"><p className="text-[15px] font-bold">Status</p><StatusPill property={hotel.status} /></div>
    <ul className="mt-4 overflow-hidden rounded-2xl border border-line">
      {items.map((item) => <li key={item.label}>
        <button type="button" onClick={() => onJump(item.step)} className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-0">
          <span className={`grid size-6 place-items-center rounded-full ${item.done ? 'bg-ok text-white' : 'border-2 border-line'}`}>{item.done ? <Icon name="check" size={14} /> : null}</span>
          <span className="flex-1 text-[14px]">{item.label}</span>
          {item.done ? null : <span className="text-[13px] font-bold text-forest">Add</span>}
        </button>
      </li>)}
    </ul>
    {hotel.property_photos.length > 0 && hotel.property_photos.length < 3 ? <p className="mt-3 text-[13px] text-warn">Tip: listings with 3 or more photos get more bookings.</p> : null}
    <div className="mt-6 grid gap-2">
      {hotel.status === 'published' ? <>
        <p className="text-[13px] text-muted">Live in the VagaGo app{hotel.published_at ? ` since ${new Date(hotel.published_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}` : ''}.</p>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void setStatus('draft')}>Unpublish (hide from guests)</Button>
        <Button type="button" variant="danger" disabled={busy} onClick={() => window.confirm('Suspend this hotel? Guests won’t see it.') && void setStatus('suspended')}>Suspend</Button>
      </> : hotel.status === 'suspended' ? <Button type="button" disabled={busy} onClick={() => void setStatus('published')}>Reinstate and publish</Button>
        : <Button type="button" disabled={busy || !ready} onClick={() => void setStatus('published')}>{ready ? 'Publish to the app' : 'Complete the checklist to publish'}</Button>}
    </div>
  </div>;
}
