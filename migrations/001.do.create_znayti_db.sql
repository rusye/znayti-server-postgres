-- Create the category table, it depends on no other
CREATE TABLE category (
  category_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  category_name VARCHAR(50) NOT NULL UNIQUE
);

-- Create the business
CREATE TABLE business (
  business_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  visual_id VARCHAR(100) NOT NULL,
  business_name VARCHAR(100) NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  category_id UUID REFERENCES category(category_id) ON DELETE CASCADE NOT NULL,
  google_place VARCHAR(100) NOT NULL,
  telephone VARCHAR(10) NOT NULL,
  deleted_on TIMESTAMPTZ DEFAULT now()
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

-- Created address table, pk is the business id
CREATE TABLE address (
  business_id UUID PRIMARY KEY REFERENCES business(business_id) NOT NULL,
  street VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  state states NOT NULL,
  zipcode VARCHAR(10) NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL
);

ALTER TABLE business
  ADD COLUMN
    address_id UUID REFERENCES address(business_id) NOT NULL UNIQUE;

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
  business_id UUID PRIMARY KEY REFERENCES business(business_id) NOT NULL,
  day_of_week days_of_week NOT NULL,
  opens TIME NOT NULL,
  closes TIME NOT NULL
);

ALTER TABLE business
  ADD COLUMN
    hours_id UUID REFERENCES hours(business_id) NOT NULL UNIQUE;