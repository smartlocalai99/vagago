-- Public reference data: Vagamon attractions (approximate positions) and the amenity catalogue.

insert into public.attractions (slug, name, kind, latitude, longitude, sort_order) values
  ('vagamon-meadows', 'Vagamon Meadows', 'Rolling grass hills', 9.6835, 76.9091, 1),
  ('vagamon-pine-forest', 'Vagamon Pine Forest', 'Forest walk', 9.6731, 76.9046, 2),
  ('vagamon-lake', 'Vagamon Lake', 'Lake and boating', 9.6905, 76.9195, 3),
  ('murugan-mala', 'Murugan Mala', 'Rock-cut temple hill', 9.6966, 76.9097, 4),
  ('kurisumala', 'Kurisumala', 'Pilgrim hilltop', 9.7057, 76.8897, 5),
  ('thangalpara', 'Thangalpara', 'Rock viewpoint', 9.7139, 76.9207, 6),
  ('paragliding-point', 'Paragliding point', 'Adventure sports', 9.6818, 76.9131, 7),
  ('marmala-waterfalls', 'Marmala Waterfalls', 'Waterfall', 9.7143, 76.8306, 8),
  ('illikkal-kallu', 'Illikkal Kallu', 'Trek and viewpoint', 9.7838, 76.8256, 9),
  ('ilaveezhapoonchira', 'Ilaveezhapoonchira', 'Hill valley viewpoint', 9.8016, 76.8150, 10)
on conflict (slug) do nothing;

insert into public.amenities (code, name, icon) values
  ('wifi', 'Wi-Fi', 'wifi'),
  ('parking', 'Free parking', 'car'),
  ('kitchen', 'Kitchen', 'coffee'),
  ('kitchenette', 'Kitchenette', 'coffee'),
  ('hot-water', 'Hot water', 'sun'),
  ('campfire', 'Campfire', 'flame'),
  ('garden', 'Private garden', 'leaf'),
  ('sit-out', 'Private sit-out', 'home'),
  ('balcony', 'Balcony or deck', 'mountain'),
  ('dining', 'Dining space', 'home'),
  ('breakfast', 'Breakfast available', 'coffee'),
  ('power-backup', 'Power backup', 'sun'),
  ('pets', 'Pets allowed', 'heart')
on conflict (code) do nothing;
