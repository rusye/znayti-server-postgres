"use strict";

const express = require("express");
const path = require("path");
const xss = require("xss");
const bodyParser = express.json();
const logger = require("../logger");

const AddressesService = require("./addresses-service");
const { addressValidationError } = require("./addresses-validator");

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

    const error = addressValidationError(newAddress);

    if (error) return res.status(400).send(error);

    AddressesService.getAllAddresses(
      req.app.get("db"),
      zipcode,
      xss(city),
      xss(street),
      suite
    )
      .then(count => {
        if (count.length > 0) {
          logger.error("address already exists");
          res.status(400).send({
            error: {
              message: "address already exists"
            }
          });
        } else {
          AddressesService.insertAddress(req.app.get("db"), newAddress).then(
            address => {
              logger.info(`Address with id ${address.id} created`);
              res
                .status(201)
                .location(path.posix.join(req.originalUrl, `${address.id}`))
                .json(serializeAddress(address));
            }
          );
        }
      })
      .catch(next);
  });

addressesRouter
  .route("/:id")

  .all((req, res, next) => {
    const { id } = req.params;

    AddressesService.getById(req.app.get("db"), id)
      .then(address => {
        if (!address) {
          logger.error(`Address with id ${id} not found`);
          return res
            .status(404)
            .json({ error: { message: "Address Not Found" } });
        }

        res.address = address;
        next();
      })
      .catch(next);
  })

  .get((req, res) => {
    res.json(serializeAddress(res.address));
  });

module.exports = addressesRouter;
