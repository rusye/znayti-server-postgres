"use strict";

const express = require("express");
const xss = require("xss");
const bodyParser = express.json();
const logger = require("../logger");

const AddressesService = require("./addresses-service");

const addressesRouter = express.Router();

const serializeAddress = address => ({
  ...address,
  ...(address.street ? { street: xss(address.street) } : null),
  ...(address.city ? { city: xss(address.city) } : null)
});

addressesRouter
  .route("/")

  .get((req, res, next) => {
  for (const param of ["zipcode", "city", "street"]) {
    if (!req.query[param]) {
    return res
      .status(400)
        .json({ error: { message: `Missing "${param}" in request params` } });
  }
  }

  const { zipcode, city, street, suite = null } = req.query;

  AddressesService.getAllAddresses(
    req.app.get("db"),
    zipcode,
    xss(city),
    xss(street),
    suite
  )
    .then(addresses => {
      res.json(addresses.map(serializeAddress));
    })
    .catch(next);
  })

  .post(bodyParser, (req, res, next) => {
    const {
      street,
      suite,
      city,
      state,
      zipcode,
      longitude,
      latitude
    } = req.body;

    const newAddress = {
      street,
      suite,
      city,
      state,
      zipcode,
      longitude,
      latitude
    };

    for (const field of [
      "street",
      "city",
      "state",
      "zipcode",
      "longitude",
      "latitude"
    ]) {
      if (!newAddress[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send({
          error: { message: `'${field}' is required` }
        });
      }
    }
});

module.exports = addressesRouter;
