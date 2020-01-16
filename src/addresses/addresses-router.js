"use strict";

const express = require("express");
const xss = require("xss");

const AddressesService = require("./addresses-service");

const addressesRouter = express.Router();

const serializeAddress = address => ({
  ...address,
  ...(address.street ? { street: xss(address.street) } : null),
  ...(address.city ? { city: xss(address.city) } : null)
});

addressesRouter.route("/").get((req, res, next) => {
  const { zipcode } = req.query;

  if (!zipcode) {
    return res
      .status(400)
      .json({ error: { message: "Missing zipcode in request params" } });
  }

  if (zipcode.length < 5 || zipcode.length > 5) {
    return res.status(400).json({
        error: {
        message: `request param zipcode is too ${
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

  AddressesService.getAllAddresses(req.app.get("db"), zipcode)
    .then(addresses => {
      res.json(addresses.map(serializeAddress));
    })
    .catch(next);
});

module.exports = addressesRouter;
