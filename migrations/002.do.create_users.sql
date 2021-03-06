-- Create the user table, it depends on no other
CREATE TABLE site_user (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  username VARCHAR(25) NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  password TEXT NOT NULL,
  deleted_on TIMESTAMPTZ DEFAULT now()
);

-- Create a review table to requires the business and user id
CREATE TABLE review (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES site_user(id) NOT NULL,
  business_id INTEGER REFERENCES business(id) NOT NULL,
  address_id INTEGER REFERENCES address(id) NOT NULL,
  content VARCHAR(5000) NOT NULL,
  rating_value SMALLINT NOT NULL CHECK(rating_value >= 1.0 AND rating_value <= 5.0),
  review_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_on TIMESTAMPTZ DEFAULT now()
);

-- Add average rating and review count columnS to business table
ALTER TABLE business
  ADD COLUMN
    average_rating NUMERIC(2, 1) CHECK(average_rating >= 1.0 AND average_rating <= 5.0),
  ADD COLUMN
    review_count INTEGER DEFAULT 0;