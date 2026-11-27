-- Optional starter catalogue. Run after schema.sql.
-- Add R2 object keys to the `image` column once product photos are uploaded,
-- e.g. 'products/tomatoes.jpg'. Leave null to show the emoji tile.

insert into public.products (id, name, category, price, unit, emoji, tone, stock, image)
values
  ('p-tomatoes', 'Tomatoes', 'Vegetables', 800, 'per kg', '', 'red', 120, null),
  ('p-mangoes', 'Mangoes', 'Fruits', 1200, 'per kg', '', 'orange', 64, null),
  ('p-potatoes', 'Irish potatoes', 'Tubers', 600, 'per kg', '', 'brown', 210, null),
  ('p-cabbage', 'Cabbage', 'Vegetables', 500, 'per head', '', 'green', 8, null),
  ('p-bananas', 'Bananas', 'Fruits', 700, 'per kg', '', 'amber', 95, null),
  ('p-beans', 'Beans', 'Grains', 1500, 'per kg', '', 'teal', 42, null),
  ('p-carrots', 'Carrots', 'Vegetables', 900, 'per kg', '', 'orange', 11, null),
  ('p-groundnuts', 'Groundnuts', 'Cooking essentials', 1800, 'per kg', '', 'brown', 58, null),
  ('p-onions', 'Onions', 'Vegetables', 750, 'per kg', '', 'amber', 140, null),
  ('p-rice', 'Rice', 'Grains', 2200, 'per 5 kg', '', 'teal', 76, null)
on conflict (id) do nothing;
