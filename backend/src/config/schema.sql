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



alter table users drop constraint users_model_id_fkey;

ALTER TABLE users
ADD CONSTRAINT users_model_id_fkey
FOREIGN KEY (model_id)
REFERENCES models(id)
ON DELETE SET NULL;

ALTER TABLE users
ALTER COLUMN model_id DROP NOT NULL;



alter table users drop constraint users_category_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_category_id_fkey
 FOREIGN KEY (category_id)
 REFERENCES categories(id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN category_id DROP NOT NULL;


 alter table users drop constraint users_processor_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_processor_id_fkey
 FOREIGN KEY (processor_id)
 REFERENCES processors(id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN processor_id DROP NOT NULL;


 alter table users drop constraint users_ram_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_ram_id_fkey
 FOREIGN KEY (ram_id)
 REFERENCES rams(id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN ram_id DROP NOT NULL;

 alter table users drop constraint users_hdd_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_hdd_id_fkey
 FOREIGN KEY (hdd_id)
 REFERENCES hdds(id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN hdd_id DROP NOT NULL;


 alter table users drop constraint users_warranty_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_warranty_id_fkey
 FOREIGN KEY (warranty_id)
 REFERENCES warranties(id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN warranty_id DROP NOT NULL;

 alter table users drop constraint users_purchase_from_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_purchase_from_id_fkey
 FOREIGN KEY (purchase_from_id)
 REFERENCES purchase_from(id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN purchase_from_id DROP NOT NULL;

 alter table users drop constraint users_os_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_os_id_fkey
 FOREIGN KEY (os_id)
 REFERENCES operating_systems(id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN os_id DROP NOT NULL;

alter table users drop constraint users_monitor_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_monitor_id_fkey
 FOREIGN KEY (monitor_id)
 REFERENCES monitors (id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN monitor_id DROP NOT NULL;

 alter table users drop constraint users_mouse_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_mouse_id_fkey
 FOREIGN KEY (mouse_id)
 REFERENCES mice  (id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN mouse_id DROP NOT NULL;


 alter table users drop constraint users_keyboard_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_keyboard_id_fkey
 FOREIGN KEY (keyboard_id)
 REFERENCES keyboards  (id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN keyboard_id DROP NOT NULL;

alter table users drop constraint users_cpu_speed_id_fkey;

 ALTER TABLE users
 ADD CONSTRAINT users_cpu_speed_id_fkey
 FOREIGN KEY (cpu_speed_id)
 REFERENCES cpu_speeds(id)
 ON DELETE SET NULL;

 ALTER TABLE users
 ALTER COLUMN cpu_speed_id DROP NOT NULL;

ALTER TABLE user_access 
ADD COLUMN email VARCHAR(255)  UNIQUE,
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expiry BIGINT;