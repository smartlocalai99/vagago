-- Category ratings and a display name for guest reviews, shown on the website once an admin
-- publishes the review. Existing policies already limit writes to the guest's own completed stays.
alter table public.reviews
  add column author_name text check (char_length(trim(author_name)) between 1 and 60),
  add column accommodation_rating smallint check (accommodation_rating between 1 and 5),
  add column connectivity_rating smallint check (connectivity_rating between 1 and 5),
  add column cleanliness_rating smallint check (cleanliness_rating between 1 and 5);

grant update (author_name, accommodation_rating, connectivity_rating, cleanliness_rating) on public.reviews to authenticated;

-- The website lists the latest published reviews.
create index reviews_published_idx on public.reviews (created_at desc) where status = 'published';
