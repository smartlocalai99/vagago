-- Example house rules for the three sample listings, so the new section shows on the site and app.
-- Hotels change these from the dashboard (Hotels -> Basics -> House rules).
update public.properties set
  house_policies = '{"couples":true,"local_id":true,"pets":true,"kids":true,"smoking":false,"alcohol":true,"parties":false,"visitors":false,"outside_food":true,"bonfire":true,"music":false}',
  house_rules = coalesce(house_rules, 'Quiet hours after 10 pm. Bonfire only in the fire pit.')
where slug = 'fern-house';

update public.properties set
  house_policies = '{"couples":true,"local_id":false,"pets":false,"kids":true,"smoking":false,"alcohol":false,"parties":false,"visitors":false,"outside_food":true,"music":false}',
  house_rules = coalesce(house_rules, 'Shoes off inside the house, please. Home-cooked Kerala dinner at 8 pm if you would like to join.')
where slug = 'cloudline-homestay';

update public.properties set
  house_policies = '{"couples":true,"local_id":true,"pets":false,"kids":true,"smoking":false,"alcohol":true,"parties":true,"visitors":true,"outside_food":true,"bonfire":true,"music":true}',
  house_rules = coalesce(house_rules, 'Music off by 11 pm. Smoking on the lawn only. Events need a day''s notice.')
where slug = 'meadow-and-stone';
