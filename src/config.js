"use strict",

module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development", 
  DATABASE_URL: process.env.DATABASE_URL,
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || "7d",
  GOOGLEMAPS_API: process.env.GOOGLEMAPS_API,
  ZOHO_USER: process.env.ZOHO_USER,
  ZOHO_PASS: process.env.ZOHO_PASS,
  ALERT_EMAIL: process.env.ALERT_EMAIL,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL
};
