"use strict";

const express = require("express");

const AddressesService = require("./addresses-service");

const addressesRouter = express.Router();

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
      res.json(addresses);
    })
    .catch(next);
});

module.exports = addressesRouter;
