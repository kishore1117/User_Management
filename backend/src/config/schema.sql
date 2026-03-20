UPDATE departments
SET location_ids = (
  SELECT ARRAY(
    SELECT DISTINCT UNNEST(location_ids)
    ORDER BY 1
  )
);

UPDATE categories
SET location_ids = (
  SELECT ARRAY(
    SELECT DISTINCT UNNEST(location_ids)
    ORDER BY 1
  )
);

CREATE OR REPLACE FUNCTION public.clean_location_ids()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location_ids := ARRAY(
    SELECT DISTINCT UNNEST(NEW.location_ids)
    ORDER BY 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clean_location_ids_departments ON departments;
DROP TRIGGER IF EXISTS trg_clean_location_ids_categories ON categories;

-- For departments
CREATE TRIGGER trg_clean_location_ids_departments
BEFORE INSERT OR UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION public.clean_location_ids();

-- For categories
CREATE TRIGGER trg_clean_location_ids_categories
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION public.clean_location_ids();