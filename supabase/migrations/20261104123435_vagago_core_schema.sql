-- VagaGo core schema: customers, hotels (properties and their teams) and platform admins.
--
-- Access model
--   * Public (anon): published listings, room types, rates, photos, amenities, attractions, published offers.
--   * Customers: their own profile, reservations and reviews. Exact address is released only
--     for a confirmed or completed reservation at that property.
--   * Hotel team (property_members): only their properties. Owners/managers edit content, rooms,
--     rates and inventory; staff can view and update reservation progress. Nobody on a hotel team
--     can publish or suspend a property.
--   * Platform admins (platform_admins): everything, with audit records.
-- Reservations are created and changed only through the functions at the end of this file so
-- price, availability and status are always decided by the database, never by the app.
-- Money is stored in paise (integer). Stay dates are local Asia/Kolkata dates; check-out is exclusive.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.stay_style as enum ('cottage', 'homestay', 'villa', 'resort', 'hotel');
create type public.property_status as enum ('draft', 'in_review', 'published', 'suspended');
create type public.member_role as enum ('owner', 'manager', 'staff');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.reservation_status as enum ('confirmed', 'checked_in', 'completed', 'cancelled', 'no_show');
create type public.payment_method as enum ('pay_at_property', 'online');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded', 'partially_refunded');
create type public.offer_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.review_status as enum ('pending', 'published', 'hidden');

-- ---------------------------------------------------------------------------
-- Shared trigger helpers
-- ---------------------------------------------------------------------------
create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 100),
  phone text check (phone ~ '^\+?[0-9]{10,15}$'),
  email text check (char_length(email) <= 254),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per signed-in person (customer, hotel team member or admin).';

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.platform_admins is 'VagaGo staff with full platform access. Add rows from the dashboard or SQL only.';

-- ---------------------------------------------------------------------------
-- Hotels
-- ---------------------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  tagline text check (char_length(tagline) <= 160),
  description text,
  stay_style public.stay_style not null,
  status public.property_status not null default 'draft',
  area text not null check (char_length(area) <= 80),
  -- Rounded position for public distance estimates; exact position lives in property_locations.
  approx_latitude numeric(6, 3) check (approx_latitude between -90 and 90),
  approx_longitude numeric(6, 3) check (approx_longitude between -180 and 180),
  check_in_time time not null default '14:00',
  check_out_time time not null default '11:00',
  house_rules text,
  cancellation_policy text,
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index properties_status_idx on public.properties (status);

create table public.property_locations (
  property_id uuid primary key references public.properties (id) on delete cascade,
  address_line text not null,
  city text not null default 'Vagamon',
  state text not null default 'Kerala',
  postal_code text not null default '685503' check (postal_code ~ '^[0-9]{6}$'),
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  arrival_instructions text,
  contact_phone text check (contact_phone ~ '^\+?[0-9]{10,15}$'),
  updated_at timestamptz not null default now()
);
comment on table public.property_locations is 'Exact address and contact. Visible to the hotel team, admins and guests with a confirmed booking.';

create table public.property_members (
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (property_id, user_id)
);
create index property_members_user_idx on public.property_members (user_id);

create table public.property_invitations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  email text not null check (char_length(email) <= 254),
  role public.member_role not null,
  status public.invitation_status not null default 'pending',
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index property_invitations_property_idx on public.property_invitations (property_id);
create unique index property_invitations_pending_idx on public.property_invitations (property_id, lower(email)) where status = 'pending';

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  icon text
);

create table public.property_amenities (
  property_id uuid not null references public.properties (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  primary key (property_id, amenity_id)
);
create index property_amenities_amenity_idx on public.property_amenities (amenity_id);

create table public.room_types (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  description text,
  max_guests smallint not null check (max_guests between 1 and 30),
  bedrooms smallint not null default 1 check (bedrooms between 0 and 20),
  beds text,
  total_units smallint not null default 1 check (total_units between 0 and 500),
  base_rate_paise integer not null check (base_rate_paise > 0),
  compare_at_paise integer check (compare_at_paise > 0),
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index room_types_property_idx on public.room_types (property_id);

create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  room_type_id uuid references public.room_types (id) on delete cascade,
  storage_path text not null,
  caption text,
  attribution text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);
create index property_photos_property_idx on public.property_photos (property_id, sort_order);
create index property_photos_room_type_idx on public.property_photos (room_type_id);

-- Date-specific price overrides. Without a row the room type's base rate applies.
create table public.daily_rates (
  room_type_id uuid not null references public.room_types (id) on delete cascade,
  stay_date date not null,
  rate_paise integer not null check (rate_paise > 0),
  primary key (room_type_id, stay_date)
);

-- Units taken out of sale on a date (maintenance, offline bookings, closures).
create table public.inventory_blocks (
  room_type_id uuid not null references public.room_types (id) on delete cascade,
  stay_date date not null,
  blocked_units smallint not null check (blocked_units >= 0),
  note text,
  updated_at timestamptz not null default now(),
  primary key (room_type_id, stay_date)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  room_type_id uuid references public.room_types (id) on delete cascade,
  title text not null check (char_length(title) <= 80),
  description text,
  discount_percent smallint not null check (discount_percent between 1 and 90),
  valid_from date not null,
  valid_to date not null,
  status public.offer_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to >= valid_from)
);
create index offers_property_idx on public.offers (property_id);
create index offers_room_type_idx on public.offers (room_type_id);

-- Public places used for "distance from this stay" estimates.
create table public.attractions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  is_active boolean not null default true,
  sort_order smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid not null references auth.users (id) on delete restrict,
  property_id uuid not null references public.properties (id) on delete restrict,
  room_type_id uuid not null references public.room_types (id) on delete restrict,
  check_in date not null,
  check_out date not null,
  nights smallint generated always as ((check_out - check_in)::smallint) stored,
  guests smallint not null check (guests between 1 and 30),
  units smallint not null default 1 check (units between 1 and 20),
  subtotal_paise integer not null check (subtotal_paise >= 0),
  taxes_paise integer not null default 0 check (taxes_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  currency char(3) not null default 'INR',
  payment_method public.payment_method not null default 'pay_at_property',
  payment_status public.payment_status not null default 'unpaid',
  status public.reservation_status not null default 'confirmed',
  guest_name text not null check (char_length(guest_name) between 2 and 100),
  guest_phone text not null check (guest_phone ~ '^\+?[0-9]{10,15}$'),
  guest_email text check (char_length(guest_email) <= 254),
  special_requests text check (char_length(special_requests) <= 1000),
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users (id) on delete set null,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in),
  check (check_out - check_in <= 30)
);
create index reservations_customer_idx on public.reservations (customer_id, check_in desc);
create index reservations_property_idx on public.reservations (property_id, check_in);
create index reservations_room_type_dates_idx on public.reservations (room_type_id, check_in, check_out) where status in ('confirmed', 'checked_in');
create index reservations_cancelled_by_idx on public.reservations (cancelled_by);

-- Per-night price lines, written only by create_reservation.
create table public.reservation_nights (
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  stay_date date not null,
  rate_paise integer not null check (rate_paise >= 0),
  primary key (reservation_id, stay_date)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete restrict,
  provider text not null,
  provider_reference text,
  amount_paise integer not null check (amount_paise <> 0),
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (provider, provider_reference)
);
create index payments_reservation_idx on public.payments (reservation_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations (id) on delete cascade,
  customer_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_property_idx on public.reviews (property_id, status);
create index reviews_customer_idx on public.reviews (customer_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id);

-- updated_at maintenance
create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger properties_updated_at before update on public.properties for each row execute function private.set_updated_at();
create trigger property_locations_updated_at before update on public.property_locations for each row execute function private.set_updated_at();
create trigger room_types_updated_at before update on public.room_types for each row execute function private.set_updated_at();
create trigger inventory_blocks_updated_at before update on public.inventory_blocks for each row execute function private.set_updated_at();
create trigger offers_updated_at before update on public.offers for each row execute function private.set_updated_at();
create trigger reservations_updated_at before update on public.reservations for each row execute function private.set_updated_at();
create trigger reviews_updated_at before update on public.reviews for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Authorization helpers (private schema: not reachable through the Data API)
-- ---------------------------------------------------------------------------
create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

create function private.has_property_role(target_property uuid, allowed public.member_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.property_members
    where property_id = target_property and user_id = (select auth.uid()) and role = any (allowed)
  );
$$;

create function private.is_property_member(target_property uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_property_role(target_property, array['owner', 'manager', 'staff']::public.member_role[]);
$$;

create function private.can_edit_property(target_property uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or private.has_property_role(target_property, array['owner', 'manager']::public.member_role[]);
$$;

create function private.is_published(target_property uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.properties where id = target_property and status = 'published');
$$;

create function private.has_booking_at(target_property uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.reservations
    where property_id = target_property and customer_id = (select auth.uid())
      and status in ('confirmed', 'checked_in', 'completed')
  );
$$;

create function private.room_type_property(target_room_type uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select property_id from public.room_types where id = target_room_type;
$$;

revoke all on all functions in schema private from public;
grant execute on function private.is_admin(), private.is_property_member(uuid), private.can_edit_property(uuid),
  private.is_published(uuid), private.has_booking_at(uuid), private.room_type_property(uuid),
  private.has_property_role(uuid, public.member_role[]) to anon, authenticated;

-- Create a profile for every new sign-up.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, phone)
  values (new.id, new.email, nullif(new.phone, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

-- Only admins can publish, suspend or reinstate a property, and only admins publish offers and reviews.
create function private.guard_admin_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if private.is_admin() or (select auth.uid()) is null then
    if tg_table_name = 'properties' and new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
      new.published_at := now();
    end if;
    return new;
  end if;
  if tg_table_name = 'properties' then
    -- Hotel teams may only move a listing between draft and in_review.
    if (tg_op = 'INSERT' and new.status not in ('draft', 'in_review'))
       or (tg_op = 'UPDATE' and old.status is distinct from new.status
           and not (old.status in ('draft', 'in_review') and new.status in ('draft', 'in_review'))) then
      raise exception 'Only VagaGo admins can publish, unpublish or suspend a property' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and old.status = 'suspended' then
      raise exception 'This property is suspended. Contact VagaGo to reinstate it' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.published_at is distinct from old.published_at then
      raise exception 'published_at is managed by VagaGo' using errcode = '42501';
    end if;
  elsif tg_table_name = 'offers' and new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    raise exception 'Only VagaGo admins can publish offers' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger properties_status_guard before insert or update on public.properties for each row execute function private.guard_admin_status();
create trigger offers_status_guard before insert or update on public.offers for each row execute function private.guard_admin_status();

create function private.audit_status_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
    values ((select auth.uid()), lower(tg_op) || '_status', tg_table_name, new.id,
      jsonb_build_object('from', case when tg_op = 'UPDATE' then old.status::text end, 'to', new.status::text));
  end if;
  return new;
end;
$$;
create trigger properties_audit after insert or update on public.properties for each row execute function private.audit_status_change();
create trigger reservations_audit after insert or update on public.reservations for each row execute function private.audit_status_change();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.properties enable row level security;
alter table public.property_locations enable row level security;
alter table public.property_members enable row level security;
alter table public.property_invitations enable row level security;
alter table public.amenities enable row level security;
alter table public.property_amenities enable row level security;
alter table public.room_types enable row level security;
alter table public.property_photos enable row level security;
alter table public.daily_rates enable row level security;
alter table public.inventory_blocks enable row level security;
alter table public.offers enable row level security;
alter table public.attractions enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_nights enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_log enable row level security;

-- profiles: yourself and admins. Hotel teams see guest contact details on the reservation itself.
create policy "Read own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy "Update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- platform_admins: admins only.
create policy "Admins read admins" on public.platform_admins for select to authenticated
  using ((select private.is_admin()));
create policy "Admins manage admins" on public.platform_admins for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- properties
create policy "Read published or own properties" on public.properties for select to anon, authenticated
  using (status = 'published' or (select private.is_admin()) or private.is_property_member(id));
create policy "Admins create properties" on public.properties for insert to authenticated
  with check ((select private.is_admin()));
create policy "Editors update properties" on public.properties for update to authenticated
  using (private.can_edit_property(id)) with check (private.can_edit_property(id));
create policy "Admins delete properties" on public.properties for delete to authenticated
  using ((select private.is_admin()));

-- property_locations: exact address
create policy "Read exact location" on public.property_locations for select to authenticated
  using ((select private.is_admin()) or private.is_property_member(property_id) or private.has_booking_at(property_id));
create policy "Editors manage location" on public.property_locations for all to authenticated
  using (private.can_edit_property(property_id)) with check (private.can_edit_property(property_id));

-- property_members: team sees its own team; only admins change membership.
create policy "Read team" on public.property_members for select to authenticated
  using ((select private.is_admin()) or user_id = (select auth.uid()) or private.is_property_member(property_id));
create policy "Admins manage team" on public.property_members for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- property_invitations: admins invite; owners can see invitations for their property.
create policy "Read invitations" on public.property_invitations for select to authenticated
  using ((select private.is_admin()) or private.has_property_role(property_id, array['owner']::public.member_role[]));
create policy "Admins manage invitations" on public.property_invitations for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- amenities and attractions: public catalogues, admin-managed.
create policy "Anyone reads amenities" on public.amenities for select to anon, authenticated using (true);
create policy "Admins manage amenities" on public.amenities for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Anyone reads active attractions" on public.attractions for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy "Admins manage attractions" on public.attractions for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Listing content that follows its property's visibility.
create policy "Read property amenities" on public.property_amenities for select to anon, authenticated
  using (private.is_published(property_id) or (select private.is_admin()) or private.is_property_member(property_id));
create policy "Editors manage property amenities" on public.property_amenities for all to authenticated
  using (private.can_edit_property(property_id)) with check (private.can_edit_property(property_id));

create policy "Read room types" on public.room_types for select to anon, authenticated
  using ((is_active and private.is_published(property_id)) or (select private.is_admin()) or private.is_property_member(property_id));
create policy "Editors manage room types" on public.room_types for all to authenticated
  using (private.can_edit_property(property_id)) with check (private.can_edit_property(property_id));

create policy "Read photos" on public.property_photos for select to anon, authenticated
  using (private.is_published(property_id) or (select private.is_admin()) or private.is_property_member(property_id));
create policy "Editors manage photos" on public.property_photos for all to authenticated
  using (private.can_edit_property(property_id)) with check (private.can_edit_property(property_id));

create policy "Read daily rates" on public.daily_rates for select to anon, authenticated
  using (private.is_published(private.room_type_property(room_type_id)) or (select private.is_admin())
    or private.is_property_member(private.room_type_property(room_type_id)));
create policy "Editors manage daily rates" on public.daily_rates for all to authenticated
  using (private.can_edit_property(private.room_type_property(room_type_id)))
  with check (private.can_edit_property(private.room_type_property(room_type_id)));

create policy "Team reads inventory blocks" on public.inventory_blocks for select to authenticated
  using ((select private.is_admin()) or private.is_property_member(private.room_type_property(room_type_id)));
create policy "Editors manage inventory blocks" on public.inventory_blocks for all to authenticated
  using (private.can_edit_property(private.room_type_property(room_type_id)))
  with check (private.can_edit_property(private.room_type_property(room_type_id)));

create policy "Read offers" on public.offers for select to anon, authenticated
  using ((status = 'published' and valid_to >= current_date and private.is_published(property_id))
    or (select private.is_admin()) or private.is_property_member(property_id));
create policy "Editors manage offers" on public.offers for all to authenticated
  using (private.can_edit_property(property_id)) with check (private.can_edit_property(property_id));

-- reservations: read-only through the API; writes go through the functions below.
create policy "Read own or property reservations" on public.reservations for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()) or private.is_property_member(property_id));

create policy "Read reservation nights" on public.reservation_nights for select to authenticated
  using (exists (
    select 1 from public.reservations r where r.id = reservation_id
      and (r.customer_id = (select auth.uid()) or (select private.is_admin()) or private.is_property_member(r.property_id))
  ));

create policy "Read payments" on public.payments for select to authenticated
  using (exists (
    select 1 from public.reservations r where r.id = reservation_id
      and (r.customer_id = (select auth.uid()) or (select private.is_admin()) or private.is_property_member(r.property_id))
  ));
create policy "Admins record payments" on public.payments for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- reviews: guests review completed stays; admins moderate.
create policy "Read reviews" on public.reviews for select to anon, authenticated
  using (status = 'published' or customer_id = (select auth.uid()) or (select private.is_admin()) or private.is_property_member(property_id));
create policy "Guests review completed stays" on public.reviews for insert to authenticated
  with check (
    customer_id = (select auth.uid()) and status = 'pending'
    and exists (select 1 from public.reservations r where r.id = reservation_id and r.customer_id = (select auth.uid())
      and r.property_id = reviews.property_id and r.status = 'completed')
  );
create policy "Guests edit pending reviews" on public.reviews for update to authenticated
  using (customer_id = (select auth.uid()) and status = 'pending')
  with check (customer_id = (select auth.uid()) and status = 'pending');
create policy "Admins moderate reviews" on public.reviews for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Admins read audit log" on public.audit_log for select to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Table privileges (RLS above decides which rows)
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
grant select on public.properties, public.amenities, public.property_amenities, public.room_types, public.property_photos,
  public.daily_rates, public.offers, public.attractions, public.reviews to anon;
grant select on all tables in schema public to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant insert, update, delete on public.platform_admins, public.properties, public.property_locations, public.property_members,
  public.property_invitations, public.amenities, public.property_amenities, public.room_types, public.property_photos,
  public.daily_rates, public.inventory_blocks, public.offers, public.attractions, public.payments to authenticated;
grant insert, update (rating, comment, status) on public.reviews to authenticated;

-- ---------------------------------------------------------------------------
-- Booking functions
-- ---------------------------------------------------------------------------

-- Units free for every night of [check_in, check_out).
create function public.room_availability(p_room_type_id uuid, p_check_in date, p_check_out date)
returns smallint
language plpgsql stable security definer set search_path = '' as $$
declare
  v_room public.room_types;
  v_free integer;
begin
  select * into v_room from public.room_types where id = p_room_type_id;
  if v_room.id is null or not v_room.is_active
     or not (private.is_published(v_room.property_id) or private.is_admin() or private.is_property_member(v_room.property_id)) then
    return 0;
  end if;
  if p_check_out <= p_check_in or p_check_out - p_check_in > 30 then
    raise exception 'Choose a stay of 1 to 30 nights' using errcode = '22023';
  end if;
  select min(v_room.total_units - coalesce(b.blocked_units, 0) - coalesce(booked.units, 0))
    into v_free
  from generate_series(p_check_in, p_check_out - 1, interval '1 day') as d(day)
  left join public.inventory_blocks b on b.room_type_id = p_room_type_id and b.stay_date = d.day::date
  left join lateral (
    select sum(r.units) as units from public.reservations r
    where r.room_type_id = p_room_type_id and r.status in ('confirmed', 'checked_in')
      and r.check_in <= d.day::date and r.check_out > d.day::date
  ) booked on true;
  return greatest(coalesce(v_free, 0), 0);
end;
$$;

-- Book a stay. Price, availability and status are decided here, never by the app.
create function public.create_reservation(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests smallint,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text default null,
  p_special_requests text default null
) returns public.reservations
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_room public.room_types;
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_subtotal integer;
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

  loop
    v_reference := 'VG-' || upper(substr(translate(encode(extensions.gen_random_bytes(6), 'base64'), '+/=0O1Il', ''), 1, 6));
    exit when char_length(v_reference) = 9 and not exists (select 1 from public.reservations where reference = v_reference);
  end loop;

  insert into public.reservations (reference, customer_id, property_id, room_type_id, check_in, check_out, guests,
    subtotal_paise, taxes_paise, total_paise, guest_name, guest_phone, guest_email, special_requests)
  values (v_reference, v_user, v_room.property_id, v_room.id, p_check_in, p_check_out, p_guests,
    v_subtotal, 0, v_subtotal, trim(p_guest_name), regexp_replace(p_guest_phone, '[\s-]', '', 'g'),
    nullif(trim(p_guest_email), ''), nullif(trim(p_special_requests), ''))
  returning * into v_reservation;

  insert into public.reservation_nights (reservation_id, stay_date, rate_paise)
  select v_reservation.id, d.day::date, coalesce(dr.rate_paise, v_room.base_rate_paise)
  from generate_series(p_check_in, p_check_out - 1, interval '1 day') as d(day)
  left join public.daily_rates dr on dr.room_type_id = p_room_type_id and dr.stay_date = d.day::date;

  return v_reservation;
end;
$$;

-- Guests cancel their own upcoming stays; hotel teams and admins can cancel any reservation of theirs.
create function public.cancel_reservation(p_reservation_id uuid, p_reason text default null)
returns public.reservations
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_reservation public.reservations;
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if v_reservation.id is null or v_user is null or not (
    v_reservation.customer_id = v_user or private.is_admin()
    or private.has_property_role(v_reservation.property_id, array['owner', 'manager']::public.member_role[])
  ) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_reservation.status <> 'confirmed' then
    raise exception 'Only confirmed bookings can be cancelled' using errcode = '22023';
  end if;
  if v_reservation.customer_id = v_user and v_reservation.check_in < v_today and not private.is_admin() then
    raise exception 'This stay has already started' using errcode = '22023';
  end if;

  update public.reservations
  set status = 'cancelled', cancelled_at = now(), cancelled_by = v_user, cancellation_reason = nullif(trim(p_reason), '')
  where id = p_reservation_id
  returning * into v_reservation;
  return v_reservation;
end;
$$;

-- Hotel teams record arrivals, departures and no-shows.
create function public.update_reservation_status(p_reservation_id uuid, p_status public.reservation_status)
returns public.reservations
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_reservation public.reservations;
begin
  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if v_reservation.id is null or not (private.is_admin() or private.is_property_member(v_reservation.property_id)) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if not (
    (v_reservation.status = 'confirmed' and p_status in ('checked_in', 'no_show'))
    or (v_reservation.status = 'checked_in' and p_status = 'completed')
  ) then
    raise exception 'Cannot change a % booking to %', v_reservation.status, p_status using errcode = '22023';
  end if;
  update public.reservations set status = p_status where id = p_reservation_id returning * into v_reservation;
  return v_reservation;
end;
$$;

-- Accept a pending invitation sent to the signed-in user's email.
create function public.accept_property_invitation(p_invitation_id uuid)
returns public.property_members
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_email text := (select email from auth.users where id = (select auth.uid()));
  v_invite public.property_invitations;
  v_member public.property_members;
begin
  select * into v_invite from public.property_invitations where id = p_invitation_id for update;
  if v_user is null or v_invite.id is null or lower(v_invite.email) <> lower(coalesce(v_email, '')) then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;
  if v_invite.status <> 'pending' or v_invite.expires_at < now() then
    raise exception 'This invitation is no longer valid' using errcode = '22023';
  end if;
  insert into public.property_members (property_id, user_id, role, invited_by)
  values (v_invite.property_id, v_user, v_invite.role, v_invite.invited_by)
  on conflict (property_id, user_id) do update set role = excluded.role
  returning * into v_member;
  update public.property_invitations set status = 'accepted', accepted_by = v_user, accepted_at = now() where id = v_invite.id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (v_user, 'accept_invitation', 'properties', v_invite.property_id, jsonb_build_object('role', v_invite.role));
  return v_member;
end;
$$;

-- Exact address for a booking the caller may see.
create function public.reservation_location(p_reservation_id uuid)
returns table (address_line text, city text, state text, postal_code text, latitude numeric, longitude numeric,
  arrival_instructions text, contact_phone text)
language sql stable security invoker set search_path = '' as $$
  select l.address_line, l.city, l.state, l.postal_code, l.latitude, l.longitude, l.arrival_instructions, l.contact_phone
  from public.reservations r
  join public.property_locations l on l.property_id = r.property_id
  where r.id = p_reservation_id and r.status in ('confirmed', 'checked_in', 'completed');
$$;

revoke all on function public.room_availability(uuid, date, date) from public;
revoke all on function public.create_reservation(uuid, date, date, smallint, text, text, text, text) from public;
revoke all on function public.cancel_reservation(uuid, text) from public;
revoke all on function public.update_reservation_status(uuid, public.reservation_status) from public;
revoke all on function public.accept_property_invitation(uuid) from public;
revoke all on function public.reservation_location(uuid) from public;
grant execute on function public.room_availability(uuid, date, date) to anon, authenticated;
grant execute on function public.create_reservation(uuid, date, date, smallint, text, text, text, text) to authenticated;
grant execute on function public.cancel_reservation(uuid, text) to authenticated;
grant execute on function public.update_reservation_status(uuid, public.reservation_status) to authenticated;
grant execute on function public.accept_property_invitation(uuid) to authenticated;
grant execute on function public.reservation_location(uuid) to authenticated;
