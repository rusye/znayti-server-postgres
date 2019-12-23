-- Create the category table, it depends on no other
CREATE TABLE category (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL UNIQUE
);

-- Created an enum that has states and us territories
CREATE TYPE states AS ENUM (
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CZ',
  'CO',
  'CT',
  'DC',
  'DE',
  'FL',
  'GA',
  'GU',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'PR',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VI',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY'
);

-- Created address table
CREATE TABLE address (
  id SERIAL PRIMARY KEY,
  street VARCHAR(50) NOT NULL,
  suite VARCHAR(10),
  city VARCHAR(50) NOT NULL,
  state states NOT NULL,
  zipcode VARCHAR(10) NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL
);

CREATE INDEX address_lat_long ON address USING gist (ll_to_earth(latitude, longitude));

-- Create the business
CREATE TABLE business (
  id SERIAL PRIMARY KEY,
  visual_id VARCHAR(100) NOT NULL UNIQUE,
  business_name VARCHAR(100) NOT NULL,
  contact_name VARCHAR(100),
  category_id INTEGER REFERENCES category(id) ON DELETE CASCADE NOT NULL,
  address_id INTEGER REFERENCES address(id) NOT NULL,
  google_place VARCHAR(100) NOT NULL,
  telephone VARCHAR(10) NOT NULL,
  deleted_on TIMESTAMPTZ
);

-- Created enum for the days of the week
CREATE TYPE days_of_week AS ENUM (
  'Sunday', 
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday', 
  'Saturday'
);

-- Created hours table, pk is the business id
CREATE TABLE hours (
  id INTEGER REFERENCES business(id) NOT NULL,
  day_of_week days_of_week NOT NULL,
  opens TIME NOT NULL,
  closes TIME NOT NULL
);

CREATE INDEX hours_id_index ON hours (id, day_of_week ASC);