"use strict";

const express = require("express");
const path = require("path");
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

    if (zipcode.length < 5 || zipcode.length > 5) {
      return res.status(400).json({
        error: {
          message: `zipcode is too ${
            zipcode.length < 5 ? "short" : "long"
          }, must have a length of 5 digits`
        }
      });
    }

    if (isNaN(zipcode)) {
      return res.status(400).json({
        error: {
          message: "request param zipcode must be numeric"
        }
      });
    }

    for (const field of ["street", "city"]) {
      if (newAddress[field].length > 50) {
        logger.error(`${field} is too long`);
        return res.status(400).send({
          error: {
            message: `'${field}' is too long, must be max length of 50 for city and street and 10 for suite`
          }
        });
      }
    }

    if (newAddress.suite && newAddress.suite.length > 10) {
      logger.error("'suite' is too long");
      return res.status(400).send({
        error: {
          message:
            "'suite' is too long, must be max length of 50 for city and street and 10 for suite"
        }
      });
    }

    if (newAddress.state.length > 2) {
      logger.error("'state' is too long");
      return res.status(400).send({
        error: {
          message:
            "'state' is too long, must be an abbreviation of state, ex Oregon would be OR"
        }
      });
    }

    if (longitude < -180 || longitude > 180) {
      logger.error("'longitude' is out of range");
      return res.status(400).send({
        error: {
          message: "'longitude' is out of range, must be between -180 and 180"
        }
      });
    }

    if (latitude < -90 || latitude > 90) {
      logger.error("'latitude' is out of range");
      return res.status(400).send({
        error: {
          message: "'latitude' is out of range, must be between -90 and 90"
        }
      });
    }

    AddressesService.insertAddress(req.app.get("db"), newAddress)
      .then(address => {
        logger.info(`Address with id ${address.id} created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `${address.id}`))
          .json(serializeAddress(address));
      })
      .catch(next);
  });

module.exports = addressesRouter;
