-- Supabase grants EXECUTE on new public functions to anon directly; only signed-in users may book or manage bookings.
revoke execute on function public.create_reservation(uuid, date, date, smallint, text, text, text, text) from anon;
revoke execute on function public.cancel_reservation(uuid, text) from anon;
revoke execute on function public.update_reservation_status(uuid, public.reservation_status) from anon;
revoke execute on function public.accept_property_invitation(uuid) from anon;
revoke execute on function public.reservation_location(uuid) from anon;

-- Replace "for all" write policies with insert/update/delete so each table has a single SELECT policy.
do $$
declare
  p record;
begin
  for p in select * from (values
    ('platform_admins', 'Admins manage admins', '(select private.is_admin())'),
    ('property_locations', 'Editors manage location', 'private.can_edit_property(property_id)'),
    ('property_members', 'Admins manage team', '(select private.is_admin())'),
    ('property_invitations', 'Admins manage invitations', '(select private.is_admin())'),
    ('amenities', 'Admins manage amenities', '(select private.is_admin())'),
    ('attractions', 'Admins manage attractions', '(select private.is_admin())'),
    ('property_amenities', 'Editors manage property amenities', 'private.can_edit_property(property_id)'),
    ('room_types', 'Editors manage room types', 'private.can_edit_property(property_id)'),
    ('property_photos', 'Editors manage photos', 'private.can_edit_property(property_id)'),
    ('daily_rates', 'Editors manage daily rates', 'private.can_edit_property(private.room_type_property(room_type_id))'),
    ('inventory_blocks', 'Editors manage inventory blocks', 'private.can_edit_property(private.room_type_property(room_type_id))'),
    ('offers', 'Editors manage offers', 'private.can_edit_property(property_id)'),
    ('payments', 'Admins record payments', '(select private.is_admin())')
  ) as t(tbl, policy, expr) loop
    execute format('drop policy %I on public.%I', p.policy, p.tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (%s)', p.policy || ' (insert)', p.tbl, p.expr);
    execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)', p.policy || ' (update)', p.tbl, p.expr, p.expr);
    execute format('create policy %I on public.%I for delete to authenticated using (%s)', p.policy || ' (delete)', p.tbl, p.expr);
  end loop;
end;
$$;

-- Reviews: one policy per action, covering both guests and admin moderation.
drop policy "Guests review completed stays" on public.reviews;
drop policy "Guests edit pending reviews" on public.reviews;
drop policy "Admins moderate reviews" on public.reviews;
create policy "Create reviews" on public.reviews for insert to authenticated
  with check (
    (select private.is_admin())
    or (customer_id = (select auth.uid()) and status = 'pending'
      and exists (select 1 from public.reservations r where r.id = reservation_id and r.customer_id = (select auth.uid())
        and r.property_id = reviews.property_id and r.status = 'completed'))
  );
create policy "Update reviews" on public.reviews for update to authenticated
  using ((select private.is_admin()) or (customer_id = (select auth.uid()) and status = 'pending'))
  with check ((select private.is_admin()) or (customer_id = (select auth.uid()) and status = 'pending'));
create policy "Admins delete reviews" on public.reviews for delete to authenticated
  using ((select private.is_admin()));
grant delete on public.reviews to authenticated;
