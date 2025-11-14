-- -- ===========================================================
-- -- 🔄 FULL RESET AND REBUILD OF USER MANAGEMENT DATABASE SCHEMA
-- -- Ensures all ON CONFLICT constraints exist properly
-- -- ===========================================================

-- -- Drop existing tables in dependency order
-- DROP TABLE IF EXISTS user_software CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS software CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS divisions CASCADE;
-- DROP TABLE IF EXISTS departments CASCADE;
-- DROP TABLE IF EXISTS locations CASCADE;

-- -- ==========================================
-- -- 📍 LOCATIONS
-- -- ==========================================
-- CREATE TABLE IF NOT EXISTS locations (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(100) UNIQUE NOT NULL,
--   address TEXT,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- ==========================================
-- -- 🏢 DEPARTMENTS (depends on location)
-- -- ==========================================
-- CREATE TABLE IF NOT EXISTS departments (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(100) NOT NULL,
--   location_id INT REFERENCES locations(id) ON DELETE CASCADE,
--   note TEXT,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE (name, location_id)
-- );

-- -- ==========================================
-- -- 🧩 DIVISIONS (depends on department)
-- -- ==========================================
-- CREATE TABLE IF NOT EXISTS divisions (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(100) NOT NULL,
--   department_id INT REFERENCES departments(id) ON DELETE CASCADE,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE (name, department_id)
-- );

-- -- ==========================================
-- -- 🗂️ CATEGORIES (depends on location)
-- -- ==========================================
-- CREATE TABLE IF NOT EXISTS categories (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(100) NOT NULL,
--   location_id INT REFERENCES locations(id) ON DELETE CASCADE,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE (name, location_id)
-- );

-- -- ==========================================
-- -- 💾 SOFTWARE (global list)
-- -- ==========================================
-- CREATE TABLE IF NOT EXISTS software (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(100) UNIQUE NOT NULL,
--   note TEXT,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- ==========================================
-- -- 👤 USERS (references hierarchy)
-- -- ==========================================
-- CREATE TABLE IF NOT EXISTS users (
--   id SERIAL PRIMARY KEY,
--   hostname VARCHAR(100) NOT NULL,
--   name VARCHAR(100) NOT NULL,

--   department_id INT REFERENCES departments(id) ON DELETE SET NULL,
--   division_id INT REFERENCES divisions(id) ON DELETE SET NULL,
--   location_id INT REFERENCES locations(id) ON DELETE SET NULL,
--   category_id INT REFERENCES categories(id) ON DELETE SET NULL,

--   ip_address1 VARCHAR(50),
--   ip_address2 VARCHAR(50),

--   floor VARCHAR(50),
--   model VARCHAR(100),
--   cpu_serial VARCHAR(100),
--   processor VARCHAR(100),
--   cpu_speed VARCHAR(50),
--   ram VARCHAR(50),
--   hdd VARCHAR(50),
--   monitor VARCHAR(100),
--   monitor_serial VARCHAR(100),
--   keyboard VARCHAR(100),
--   mouse VARCHAR(100),
--   cd_dvd VARCHAR(50),
--   os VARCHAR(100),
--   usb BOOLEAN DEFAULT FALSE,

--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- ==========================================
-- -- 🔗 USER ↔ SOFTWARE MAPPING (Many-to-Many)
-- -- ==========================================
-- CREATE TABLE IF NOT EXISTS user_software (
--   user_id INT REFERENCES users(id) ON DELETE CASCADE,
--   software_id INT REFERENCES software(id) ON DELETE CASCADE,
--   PRIMARY KEY (user_id, software_id)
-- );

-- -- ==========================================
-- -- 🧠 Optional Trigger for auto-updating "updated_at"
-- -- ==========================================
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE 'plpgsql';

-- -- Attach trigger to key tables
-- CREATE TRIGGER trg_update_locations_updated_at
-- BEFORE UPDATE ON locations
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER trg_update_departments_updated_at
-- BEFORE UPDATE ON departments
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER trg_update_divisions_updated_at
-- BEFORE UPDATE ON divisions
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER trg_update_categories_updated_at
-- BEFORE UPDATE ON categories
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER trg_update_software_updated_at
-- BEFORE UPDATE ON software
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER trg_update_users_updated_at
-- BEFORE UPDATE ON users
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- ===========================================================
-- -- ✅ SCHEMA CREATION COMPLETE
-- -- ===========================================================


-- ===============================
-- 🧩 UNIQUE CONSTRAINTS SETUP FIX
-- ===============================

-- 1️⃣ Locations table
ALTER TABLE IF EXISTS locations
  DROP CONSTRAINT IF EXISTS locations_name_key;
ALTER TABLE locations
  ADD CONSTRAINT locations_name_key UNIQUE (name);

-- 2️⃣ Departments table
ALTER TABLE IF EXISTS departments
  DROP CONSTRAINT IF EXISTS departments_name_key;
ALTER TABLE departments
  ADD CONSTRAINT departments_name_key UNIQUE (name);

-- 3️⃣ Divisions table
ALTER TABLE IF EXISTS divisions
  DROP CONSTRAINT IF EXISTS divisions_name_key;
ALTER TABLE divisions
  ADD CONSTRAINT divisions_name_key UNIQUE (name);

-- 4️⃣ Categories table
ALTER TABLE IF EXISTS categories
  DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE categories
  ADD CONSTRAINT categories_name_key UNIQUE (name);

-- 5️⃣ Software table
ALTER TABLE IF EXISTS software
  DROP CONSTRAINT IF EXISTS software_name_key;
ALTER TABLE software
  ADD CONSTRAINT software_name_key UNIQUE (name);

-- 6️⃣ User–Software relationship (for ON CONFLICT DO NOTHING)
ALTER TABLE IF EXISTS user_software
  DROP CONSTRAINT IF EXISTS user_software_user_id_software_id_key;
ALTER TABLE user_software
  ADD CONSTRAINT user_software_user_id_software_id_key UNIQUE (user_id, software_id);
