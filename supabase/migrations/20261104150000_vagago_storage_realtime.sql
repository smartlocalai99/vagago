-- Property photo storage and live booking updates for the admin dashboard.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-photos', 'property-photos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Files live under <property_id>/<file>. The bucket is public, so reads need no policy;
-- writes are limited to admins and the property's owners/managers.
create function private.can_manage_photo(object_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_property uuid;
begin
  begin
    v_property := (storage.foldername(object_name))[1]::uuid;
  exception when invalid_text_representation then
    return false;
  end;
  return private.can_edit_property(v_property);
end;
$$;
revoke all on function private.can_manage_photo(text) from public;
grant execute on function private.can_manage_photo(text) to authenticated;

create policy "Editors upload property photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-photos' and private.can_manage_photo(name));
create policy "Editors read property photo objects" on storage.objects for select to authenticated
  using (bucket_id = 'property-photos' and private.can_manage_photo(name));
create policy "Editors replace property photos" on storage.objects for update to authenticated
  using (bucket_id = 'property-photos' and private.can_manage_photo(name))
  with check (bucket_id = 'property-photos' and private.can_manage_photo(name));
create policy "Editors delete property photos" on storage.objects for delete to authenticated
  using (bucket_id = 'property-photos' and private.can_manage_photo(name));

-- Stream reservation changes (RLS still applies) so the dashboard updates without polling.
alter publication supabase_realtime add table public.reservations;
