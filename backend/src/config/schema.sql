CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 1️⃣ Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ Software Table
CREATE TABLE IF NOT EXISTS software (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3️⃣ Divisions Table
CREATE TABLE IF NOT EXISTS divisions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_access (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- store hashed password
    role VARCHAR(50) NOT NULL,
    location_ids INT[] NOT NULL,     -- array of location IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to validate location_ids exist
CREATE OR REPLACE FUNCTION validate_location_ids()
RETURNS TRIGGER AS $$
DECLARE
    loc_id INT;
BEGIN
    FOREACH loc_id IN ARRAY NEW.location_ids
    LOOP
        -- Check if location exists
        IF NOT EXISTS (SELECT 1 FROM locations WHERE id = loc_id) THEN
            RAISE EXCEPTION 'Invalid location_id: %', loc_id;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_access
CREATE TRIGGER check_valid_location_ids
BEFORE INSERT OR UPDATE ON user_access
FOR EACH ROW
EXECUTE FUNCTION validate_location_ids();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_access_updated_at
BEFORE UPDATE ON user_access
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- -- Sample locations
-- INSERT INTO locations (name, address)
-- VALUES
-- ('Chennai Office', 'No. 45, Anna Salai'),
-- ('Bangalore Office', '12 MG Road');

-- -- Sample users with multiple locations
-- INSERT INTO user_access (username, password, role, location_ids)
-- VALUES
-- ('admin', 'hashed_pwd', 'Admin', '{1,2}'),   -- Chennai & Bangalore
-- ('manager', 'hashed_pwd', 'Manager', '{1}'); -- Chennai only
