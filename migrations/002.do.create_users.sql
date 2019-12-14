-- Create the user table, it depends on no other
CREATE TABLE site_user (
  user_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  password TEXT NOT NULL,
  deleted_on TIMESTAMPTZ DEFAULT now()
);

-- Add review count column to business table
ALTER TABLE business
  ADD COLUMN
    review_count INTEGER NOT NULL;

-- Create a review table to requires the business and user id
CREATE TABLE review (
  review_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES site_user(user_id) NOT NULL,
  business_id UUID REFERENCES business(business_id) NOT NULL,
  content TEXT NOT NULL,
  rating_value INTEGER NOT NULL,
  review_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_on TIMESTAMPTZ DEFAULT now()
);