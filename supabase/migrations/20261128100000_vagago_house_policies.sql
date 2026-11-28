-- Selectable house rules (couple friendly, pets, smoking, ...). Each key is true (allowed) or
-- false (not allowed); a missing key means the property has not said. The free-text
-- house_rules column stays for anything else.
alter table public.properties
  add column house_policies jsonb not null default '{}'::jsonb
  constraint properties_house_policies_shape check (
    jsonb_typeof(house_policies) = 'object'
    and house_policies - array['couples', 'local_id', 'pets', 'kids', 'smoking', 'alcohol', 'parties', 'visitors', 'outside_food', 'bonfire', 'music'] = '{}'::jsonb
    and not jsonb_path_exists(house_policies, '$.* ? (@.type() != "boolean")')
  );

comment on column public.properties.house_policies is 'House rules as {rule: allowed}. Keys: couples, local_id, pets, kids, smoking, alcohol, parties, visitors, outside_food, bonfire, music.';
