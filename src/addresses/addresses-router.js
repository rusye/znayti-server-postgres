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
  for (const param of ["zipcode", "city", "street"]) {
    if (!req.query[param]) {
    return res
      .status(400)
        .json({ error: { message: `Missing "${param}" in request params` } });
  }
  }

  const { zipcode, city, street, suite = null } = req.query;

  AddressesService.getAllAddresses(req.app.get("db"), zipcode,city, street, suite)
    .then(addresses => {
      res.json(addresses.map(serializeAddress));
    })
    .catch(next);
});

module.exports = addressesRouter;
