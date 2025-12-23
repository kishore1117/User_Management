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