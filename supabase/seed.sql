-- Local development only (`supabase db reset`). Fictional demo stays matching the app's sample data.
-- Not applied to the hosted project by `supabase db push`.

insert into public.properties (slug, name, tagline, description, stay_style, status, area, approx_latitude, approx_longitude) values
  ('fern-house', 'The Fern House', 'For mornings that take their time.', 'A small cottage at the edge of the trees.', 'cottage', 'published', 'Near Pine Forest', 9.676, 76.902),
  ('cloudline-cabin', 'Cloudline Homestay', 'A little above the everyday.', 'A hillside homestay for two.', 'homestay', 'published', 'Near Murugan Mala', 9.695, 76.913),
  ('meadow-villa', 'Meadow & Stone', 'Bring your favourite people.', 'A garden villa for small groups.', 'villa', 'published', 'Near Vagamon Meadows', 9.688, 76.906)
on conflict (slug) do nothing;

insert into public.property_locations (property_id, address_line, latitude, longitude)
select id, v.address, v.lat, v.lng from public.properties p
join (values
  ('fern-house', 'Pine Valley Road, near Vagamon Pine Forest', 9.6762, 76.9018),
  ('cloudline-cabin', 'Murugan Mala Road', 9.6951, 76.9128),
  ('meadow-villa', 'Kolahalamedu Road, near Vagamon Meadows', 9.6878, 76.9061)
) as v(slug, address, lat, lng) on v.slug = p.slug
on conflict (property_id) do nothing;

insert into public.room_types (property_id, name, max_guests, bedrooms, beds, total_units, base_rate_paise, compare_at_paise)
select id, v.name, v.guests, v.bedrooms, v.beds, 1, v.rate, v.compare from public.properties p
join (values
  ('fern-house', 'Entire cottage', 4, 2, '2 bedrooms', 640000, 800000),
  ('cloudline-cabin', 'Entire homestay', 2, 1, '1 bedroom', 820000, 1000000),
  ('meadow-villa', 'Entire villa', 6, 3, '3 bedrooms', 1280000, 1600000)
) as v(slug, name, guests, bedrooms, beds, rate, compare) on v.slug = p.slug;
