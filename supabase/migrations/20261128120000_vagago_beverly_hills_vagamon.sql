-- Beverly Hills Vagamon (signed partner). Details from the property's public listing;
-- photos are the property's own and are stored under property-photos/de318694-6927-4d6c-8240-d94f067a3923/.
insert into public.properties (id, slug, name, tagline, description, stay_style, status, area,
  approx_latitude, approx_longitude, check_in_time, check_out_time, house_policies, cancellation_policy, published_at)
values ('de318694-6927-4d6c-8240-d94f067a3923', 'beverly-hills-vagamon', 'Beverly Hills Vagamon',
  'A three-bedroom villa in the middle of a tea garden.',
  'A private villa set among tea bushes, about 5 km from Vagamon town and 6 km from the Barren Hills. Each of the three bedrooms has a queen bed and its own bathroom, and the living room has a sofa bed. Cook in the full kitchen or ask for a Kerala breakfast, then end the day with a barbecue and a bonfire in the garden. Free Wi-Fi and parking.',
  'villa', 'published', 'Tea gardens, 5 km from Vagamon town',
  9.709, 76.926, '13:00', '11:00', '{"kids": true, "bonfire": true}',
  'Free cancellation until 48 hours before check-in.', now());

insert into public.property_locations (property_id, address_line, latitude, longitude, arrival_instructions)
values ('de318694-6927-4d6c-8240-d94f067a3923', '7aam Number Rd, Vagamon', 9.708993, 76.925829, 'Check-in from 1 pm to 6 pm. Tell the host your arrival time on the day.');

insert into public.room_types (property_id, name, description, max_guests, bedrooms, beds, total_units, base_rate_paise, sort_order)
values ('de318694-6927-4d6c-8240-d94f067a3923', 'Three-bedroom villa',
  'The whole villa: three bedrooms with queen beds, three bathrooms, a sofa bed in the living room, a full kitchen and mountain views. 139 m².',
  8, 3, '3 queen beds, 1 sofa bed', 1, 424900, 0);

insert into public.property_photos (property_id, storage_path, sort_order) values
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/00.jpg', 0),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/09.jpg', 1),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/02.jpg', 2),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/08.jpg', 3),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/12.jpg', 4),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/05.jpg', 5),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/04.jpg', 6),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/03.jpg', 7),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/15.jpg', 8),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/17.jpg', 9),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/11.jpg', 10),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/01.jpg', 11),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/06.jpg', 12),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/07.jpg', 13),
  ('de318694-6927-4d6c-8240-d94f067a3923', 'de318694-6927-4d6c-8240-d94f067a3923/10.jpg', 14);

insert into public.property_amenities (property_id, amenity_id)
select 'de318694-6927-4d6c-8240-d94f067a3923', id from public.amenities
where name in ('Wi-Fi', 'Free parking', 'Kitchen', 'Breakfast available', 'Private garden', 'Dining space', 'Campfire', 'Hot water');
