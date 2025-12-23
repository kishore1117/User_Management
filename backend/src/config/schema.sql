-- SQL script to recreate the database schema

-- Table: locations
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    note TEXT,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: divisions
CREATE TABLE divisions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: models
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: cpu_serials
CREATE TABLE cpu_serials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: processors
CREATE TABLE processors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: cpu_speeds
CREATE TABLE cpu_speeds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: rams
CREATE TABLE rams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: hdds
CREATE TABLE hdds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: monitors
CREATE TABLE monitors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: monitor_serials
CREATE TABLE monitor_serials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: keyboards
CREATE TABLE keyboards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: mice
CREATE TABLE mice (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: cd_dvds
CREATE TABLE cd_dvds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: operating_systems
CREATE TABLE operating_systems (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: warranties
CREATE TABLE warranties (
    id SERIAL PRIMARY KEY,
    warranty_name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: purchase_from
CREATE TABLE purchase_from (
    id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: software
CREATE TABLE software (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_access (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
    location_ids INT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(255),
    name VARCHAR(255),
    location_id INT REFERENCES locations(id),
    department_id INT REFERENCES departments(id),
    division_id INT REFERENCES divisions(id),
    category_id INT REFERENCES categories(id),
    ip_address1 VARCHAR(15),
    ip_address2 VARCHAR(15),
    floor VARCHAR(50),
    model_id INT REFERENCES models(id),
    cpu_serial_id INT REFERENCES cpu_serials(id),
    processor_id INT REFERENCES processors(id),
    cpu_speed_id INT REFERENCES cpu_speeds(id),
    ram_id INT REFERENCES rams(id),
    hdd_id INT REFERENCES hdds(id),
    monitor_id INT REFERENCES monitors(id),
    monitor_serial_id INT REFERENCES monitor_serials(id),
    keyboard_id INT REFERENCES keyboards(id),
    mouse_id INT REFERENCES mice(id),
    cd_dvd_id INT REFERENCES cd_dvds(id),
    os_id INT REFERENCES operating_systems(id),
    asset_tag VARCHAR(255),
    warranty_id INT REFERENCES warranties(id),
    purchase_from_id INT REFERENCES purchase_from(id),
    usb BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_software
CREATE TABLE user_software (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    software_id INT REFERENCES software(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, software_id)
);

-- ===============================
-- 🧩 UNIQUE CONSTRAINTS SETUP FIX
-- ===============================

--1️⃣ Locations table
ALTER TABLE IF EXISTS locations
  DROP CONSTRAINT IF EXISTS locations_name_key;
ALTER TABLE locations
  ADD CONSTRAINT locations_name_key UNIQUE (name);

--2️⃣ Departments table
ALTER TABLE IF EXISTS departments
  DROP CONSTRAINT IF EXISTS departments_name_key;
ALTER TABLE departments
  ADD CONSTRAINT departments_name_key UNIQUE (name);

--3️⃣ Divisions table
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

  ALTER TABLE warranties
ADD CONSTRAINT unique_warranty_name UNIQUE (warranty_name);


-- Table: models
ALTER TABLE models
ADD CONSTRAINT unique_models_name UNIQUE (name);

-- Table: cpu_serials
ALTER TABLE cpu_serials
ADD CONSTRAINT unique_cpu_serials_name UNIQUE (name);

-- Table: processors
ALTER TABLE processors
ADD CONSTRAINT unique_processors_name UNIQUE (name);

-- Table: cpu_speeds
ALTER TABLE cpu_speeds
ADD CONSTRAINT unique_cpu_speeds_name UNIQUE (name);

-- Table: rams
ALTER TABLE rams
ADD CONSTRAINT unique_rams_name UNIQUE (name);

-- Table: hdds
ALTER TABLE hdds
ADD CONSTRAINT unique_hdds_name UNIQUE (name);

-- Table: monitors
ALTER TABLE monitors
ADD CONSTRAINT unique_monitors_name UNIQUE (name);

-- Table: monitor_serials
ALTER TABLE monitor_serials
ADD CONSTRAINT unique_monitor_serials_name UNIQUE (name);

-- Table: keyboards
ALTER TABLE keyboards
ADD CONSTRAINT unique_keyboards_name UNIQUE (name);

-- Table: mice
ALTER TABLE mice
ADD CONSTRAINT unique_mice_name UNIQUE (name);

-- Table: cd_dvds
ALTER TABLE cd_dvds
ADD CONSTRAINT unique_cd_dvds_name UNIQUE (name);

-- Table: operating_systems
ALTER TABLE operating_systems
ADD CONSTRAINT unique_operating_systems_name UNIQUE (name);

-- Table: warranties
ALTER TABLE warranties
ADD CONSTRAINT unique_warranties_name UNIQUE (warranty_name);

-- Table: purchase_from
ALTER TABLE purchase_from
ADD CONSTRAINT unique_purchase_from_name UNIQUE (vendor_name);


ALTER TABLE users
ADD COLUMN serial_name VARCHAR(50);

ALTER TABLE users
ADD COLUMN printer_type VARCHAR(50)
CHECK (printer_type IN ('NETWORK', 'USB'));

ALTER TABLE categories
ADD COLUMN location_ids INT[];

ALTER TABLE software
ADD COLUMN location_ids INT[] DEFAULT '{}';

INSERT INTO locations (name, address)
VALUES
('Guindy HQ',  'guindy office'),
('Perungudi', 'perungudi'),
('Plant1', 'plant1');


INSERT INTO user_access (
    username,
    password,
    role,
    location_ids
)
VALUES (
    'admin01',
    'admin_hash',
    'admin',
    ARRAY[1, 2, 3]
);
