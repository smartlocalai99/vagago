-- Store requirements: guests can delete their account from the app, and contact support.

-- Deletes the signed-in guest's personal data. Upcoming bookings are cancelled; past bookings
-- stay for the property's records but lose the guest's name, phone, email and notes. The login
-- itself is removed when no booking still refers to it.
create function public.delete_my_account()
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if v_user is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;

  update public.reservations
  set status = 'cancelled', cancelled_at = now(), cancelled_by = v_user, cancellation_reason = 'Guest deleted their account'
  where customer_id = v_user and status = 'confirmed' and check_in >= v_today;

  update public.reservations
  set guest_name = 'Deleted guest', guest_phone = '0000000000', guest_email = null, special_requests = null
  where customer_id = v_user;

  delete from public.reviews where customer_id = v_user;
  delete from public.support_requests where user_id = v_user;
  update public.profiles set full_name = null, phone = null, email = null, avatar_url = null where id = v_user;

  if not exists (select 1 from public.reservations where customer_id = v_user) then
    delete from auth.users where id = v_user;
  end if;
end;
$$;

-- Messages from the app and the website's support page. Anyone may write one; only admins read them.
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(trim(name)) between 2 and 100),
  contact text not null check (char_length(trim(contact)) between 5 and 254),
  message text not null check (char_length(trim(message)) between 10 and 2000),
  source text not null default 'app' check (source in ('app', 'website')),
  created_at timestamptz not null default now()
);
create index support_requests_created_idx on public.support_requests (created_at desc);
alter table public.support_requests enable row level security;

create policy "Send support requests" on public.support_requests for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "Admins read support requests" on public.support_requests for select to authenticated
  using ((select private.is_admin()));

grant insert on public.support_requests to anon, authenticated;
grant select on public.support_requests to authenticated;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
