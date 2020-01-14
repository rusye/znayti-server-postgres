"use strict";

const express = require("express");

const AddressesService = require("./addresses-service");

const addressesRouter = express.Router();

addressesRouter.route("/").get((req, res, next) => {
  if (!req.query.zipcode) {
    return res
      .status(400)
      .json({ error: { message: "Missing zipcode in request params" } });
  }

  if (req.query.zipcode.length < 5 || req.query.zipcode.length > 5) {
    return res.status(400).json({
        error: {
        message: `request param "zipcode" is too ${
          req.query.zipcode.length < 5 ? "short" : "long"
        }, must have a length of 5 digits`
  }
      });
  }

  AddressesService.getAllAddresses(req.app.get("db"))
    .then(addresses => {
      res.json(addresses);
    })
    .catch(next);
});

module.exports = addressesRouter;
