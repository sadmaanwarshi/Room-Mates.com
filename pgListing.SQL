CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(15) UNIQUE NOT NULL,
  university VARCHAR(100) NOT NULL,
  program VARCHAR(100) NOT NULL,
  yearOfStudy VARCHAR(20) NOT NULL,
  address TEXT,
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  dob DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ownwer--
CREATE TABLE owners (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(100) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    license_number VARCHAR(50), -- Optional field
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    property_name VARCHAR(100) NOT NULL,
    business_description TEXT, -- Optional field
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   
);

--pg_listing--
CREATE TABLE pg_listings (
  id SERIAL PRIMARY KEY,
  pg_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
	phone_number TEXT,
  alternate_phone_number TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  main_image TEXT,
	images TEXT[],
	amenities JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  owner_id INT REFERENCES owners(id) ON DELETE CASCADE,
  owner_name VARCHAR(100),
  available_rooms INTEGER
);

CREATE TABLE pg_room_info (
  pg_id INT REFERENCES pg_listings(id) ON DELETE CASCADE,
  notice_period INTEGER,
  preferred_tenants TEXT,
  description TEXT,
  preferred_gender TEXT,
  rent_type TEXT,
  quantity INTEGER,
	room_type VARCHAR(100),
  PRIMARY KEY (pg_id)
);

CREATE TABLE pg_cost_details (
  pg_id INT REFERENCES pg_listings(id) ON DELETE CASCADE,
	price_per_month NUMERIC,
  deposit_amount NUMERIC,
  electric_charge NUMERIC,
  maintenance_fee NUMERIC,
	food_availabilty BOOLEAN,
	food_type VARCHAR(100),
  PRIMARY KEY (pg_id)
);

CREATE TABLE pg_nearby_location_details(
	pg_id INT REFERENCES pg_listings(id) ON DELETE CASCADE,
	nearby_universities TEXT,
  nearby_organizations TEXT,
  nearby_locations TEXT[],
	 PRIMARY KEY (pg_id)
);

CREATE TABLE pg_rules_new (
  pgid INT REFERENCES pg_listings(id) ON DELETE CASCADE,
  custom_rule TEXT[], -- Array for custom rules
  PRIMARY KEY (pgid)
);




CREATE TABLE bookings (
    id SERIAL PRIMARY KEY, -- Unique identifier for each booking
    user_id INT NOT NULL, -- ID of the user making the booking
    pg_id INT NOT NULL, -- ID of the PG listing
    full_name VARCHAR(100) NOT NULL, -- Full name of the user
	father_name VARCHAR(100) NOT NULL, -- User's father's name
    address VARCHAR(255) NOT NULL, -- User's address
    police_station VARCHAR(100) NOT NULL, -- User's local police station
    city VARCHAR(100) NOT NULL, -- User's city
    university VARCHAR(100) NOT NULL, -- User's university name
    course VARCHAR(100) NOT NULL, -- User's course name
    duration VARCHAR(100) NOT NULL, -- Duration of the course

    check_in DATE NOT NULL, -- Check-in date
   
    status VARCHAR(20) DEFAULT 'Pending', -- Booking status (Pending, Accepted, Rejected)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of booking creation
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of last update
    FOREIGN KEY (user_id) REFERENCES owners(id), -- Assuming you have a users table
    FOREIGN KEY (pg_id) REFERENCES pg_listings(id) -- Assuming you have a pg_listings table
);
