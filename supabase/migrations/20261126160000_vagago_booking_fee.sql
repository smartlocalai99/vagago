-- Flat ₹100 booking fee on every booking. The offer discount applies to the stay only;
-- the total the guest pays is stay - discount + fee.
alter table public.reservations
  add column booking_fee_paise integer not null default 0 check (booking_fee_paise >= 0);

drop function public.create_reservation(uuid, date, date, smallint, text, text, text, text, text);

create function public.create_reservation(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests smallint,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text default null,
  p_special_requests text default null,
  p_offer_code text default null
) returns public.reservations
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_room public.room_types;
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_subtotal integer;
  v_offer text := nullif(upper(trim(p_offer_code)), '');
  v_percent integer := 0;
  v_discount integer := 0;
  -- Flat booking fee on every booking, in paise.
  v_fee integer := 10000;
  v_reservation public.reservations;
  v_reference text;
begin
  if v_user is null then
    raise exception 'Sign in to book' using errcode = '42501';
  end if;
  if p_check_in < v_today then
    raise exception 'Check-in cannot be in the past' using errcode = '22023';
  end if;
  if p_check_in > v_today + 365 then
    raise exception 'Bookings open up to one year ahead' using errcode = '22023';
  end if;

  if v_offer = 'WELCOME12' then
    if exists (select 1 from public.reservations where customer_id = v_user and status <> 'cancelled') then
      raise exception 'The first-stay offer is only for your first booking' using errcode = '22023';
    end if;
    v_percent := 12;
  elsif v_offer is not null then
    if v_offer <> upper(to_char(v_today, 'FMMon')) || '10' then
      raise exception 'This offer is not available' using errcode = '22023';
    end if;
    v_percent := 10;
  end if;

  -- Lock the room type so two guests cannot take the last unit at the same time.
  select * into v_room from public.room_types where id = p_room_type_id for update;
  if v_room.id is null or not v_room.is_active or not private.is_published(v_room.property_id) then
    raise exception 'This stay is not available' using errcode = 'P0002';
  end if;
  if p_guests < 1 or p_guests > v_room.max_guests then
    raise exception 'This stay fits up to % guests', v_room.max_guests using errcode = '22023';
  end if;
  if public.room_availability(p_room_type_id, p_check_in, p_check_out) < 1 then
    raise exception 'Sold out for these dates' using errcode = 'P0001';
  end if;

  select sum(coalesce(dr.rate_paise, v_room.base_rate_paise)) into v_subtotal
  from generate_series(p_check_in, p_check_out - 1, interval '1 day') as d(day)
  left join public.daily_rates dr on dr.room_type_id = p_room_type_id and dr.stay_date = d.day::date;
  v_discount := round(v_subtotal * v_percent / 100.0);

  loop
    v_reference := 'VG-' || upper(substr(translate(encode(extensions.gen_random_bytes(6), 'base64'), '+/=0O1Il', ''), 1, 6));
    exit when char_length(v_reference) = 9 and not exists (select 1 from public.reservations where reference = v_reference);
  end loop;

  insert into public.reservations (reference, customer_id, property_id, room_type_id, check_in, check_out, guests,
    subtotal_paise, taxes_paise, discount_paise, booking_fee_paise, total_paise, offer_code, guest_name, guest_phone, guest_email, special_requests)
  values (v_reference, v_user, v_room.property_id, v_room.id, p_check_in, p_check_out, p_guests,
    v_subtotal, 0, v_discount, v_fee, v_subtotal - v_discount + v_fee, case when v_percent > 0 then v_offer end,
    trim(p_guest_name), regexp_replace(p_guest_phone, '[\s-]', '', 'g'),
    nullif(trim(p_guest_email), ''), nullif(trim(p_special_requests), ''))
  returning * into v_reservation;

  insert into public.reservation_nights (reservation_id, stay_date, rate_paise)
  select v_reservation.id, d.day::date, coalesce(dr.rate_paise, v_room.base_rate_paise)
  from generate_series(p_check_in, p_check_out - 1, interval '1 day') as d(day)
  left join public.daily_rates dr on dr.room_type_id = p_room_type_id and dr.stay_date = d.day::date;

  return v_reservation;
end;
$$;

revoke all on function public.create_reservation(uuid, date, date, smallint, text, text, text, text, text) from public, anon;
grant execute on function public.create_reservation(uuid, date, date, smallint, text, text, text, text, text) to authenticated;
